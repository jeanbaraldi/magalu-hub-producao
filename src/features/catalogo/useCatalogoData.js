import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { lerPedidos, lerSkus } from '../magalu/magaluDb'
import { agregarPorSku } from '../magalu/itens'
import { diaBrt, inicioDoPeriodo } from '../magalu/vendas'
import { useGestaoConfig } from '../magalu/useGestaoConfig'
import { mapCatalogo } from './catalogo.mapper'
import { buildDiagnostico, vendasPorDia } from './diagnostico.mapper'

const JANELA_DIAS = 30
const HISTORICO_DIAS = 90

/**
 * Único ponto de fetch de Anúncios e Produtos (Catálogo e Diagnóstico): catálogo da loja,
 * pedidos de 90 dias, primeiro pedido gravado e custos/configuração (useGestaoConfig). Traz
 * também as ações: puxar os custos da Precificação e pedir a sincronização com a Magalu.
 */
export function useCatalogoData() {
  const { contaId, isConnected, supabaseUrl, supabaseAnonKey } = useApp()
  const gestao = useGestaoConfig()
  const [estado, setEstado] = useState({ conta: null, skus: [], pedidos: null, desde: null, error: null, avisoVendas: null })
  const [loading, setLoading] = useState(false)
  const [puxandoCustos, setPuxandoCustos] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    const [skus, pedidos, primeiro] = await Promise.allSettled([
      lerSkus(contaId),
      lerPedidos(contaId, inicioDoPeriodo(HISTORICO_DIAS)),
      supabase.from('orders').select('purchased_at').eq('account_id', contaId)
        .order('purchased_at', { ascending: true }).limit(1).maybeSingle(),
    ])
    if (meu !== pedido.current) return
    const p1 = primeiro.status === 'fulfilled' && !primeiro.value.error ? primeiro.value.data : null
    setEstado({
      conta: contaId,
      skus: skus.status === 'fulfilled' ? skus.value : [],
      error: skus.status === 'rejected' ? skus.reason?.message ?? String(skus.reason) : null,
      pedidos: pedidos.status === 'fulfilled' ? pedidos.value : null,
      desde: p1?.purchased_at ? diaBrt(p1.purchased_at) : null,
      avisoVendas: pedidos.status === 'rejected' ? `Vendas indisponíveis: ${pedidos.reason?.message ?? pedidos.reason}` : null,
    })
    setLoading(false)
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  const daConta = estado.conta === contaId
  const vendas30 = useMemo(() => {
    if (!daConta || estado.pedidos == null) return null
    const desde = inicioDoPeriodo(JANELA_DIAS)
    return agregarPorSku(estado.pedidos.filter((p) => p.purchased_at >= desde))
  }, [daConta, estado.pedidos])

  const rows = useMemo(
    () => (daConta ? mapCatalogo(estado.skus, gestao.custos, vendas30, gestao.cfg, { podeVerValores: gestao.podeVerValores, reais: gestao.reais }) : []),
    [daConta, estado.skus, gestao.custos, vendas30, gestao.cfg, gestao.podeVerValores, gestao.reais],
  )

  const hoje = diaBrt(new Date().toISOString())
  const diagnostico = useMemo(
    () => (daConta && estado.pedidos != null ? buildDiagnostico(rows, vendasPorDia(estado.pedidos), hoje, estado.desde) : []),
    [daConta, estado.pedidos, estado.desde, rows, hoje],
  )

  const refetch = useCallback(() => { carregar(); gestao.refetch() }, [carregar, gestao])

  /** Grava em cada SKU o custo real da Precificação (precificacao.sincronizar_loja). */
  const puxarCustos = useCallback(async () => {
    if (!contaId) return
    setPuxandoCustos(true)
    setAviso(null)
    const { data, error } = await supabase.schema('precificacao').rpc('sincronizar_loja', { p_sistema: 'magalu', p_conta: contaId })
    setPuxandoCustos(false)
    if (error) { setAviso({ tom: 'erro', texto: `Não foi possível puxar os custos da Precificação: ${error.message}` }); return }
    const r = data ?? {}
    setAviso({
      tom: 'ok',
      texto: `${r.custos_atualizados ?? 0} custo(s) atualizado(s) pela Precificação.`
        + (r.sem_custo ? ` ${r.sem_custo} SKU(s) sem custo lá mantiveram o custo atual.` : ''),
    })
    gestao.refetch()
  }, [contaId, gestao])

  /** Pede ao magalu-sync uma nova leitura do catálogo da loja. */
  const sincronizar = useCallback(async () => {
    if (!contaId) return
    setSincronizando(true)
    setAviso(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${supabaseUrl}/functions/v1/magalu-sync`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: contaId, kind: 'skus', days: 30 }),
      })
      const corpo = await res.json().catch(() => null)
      if (!res.ok) throw new Error(corpo?.message ?? corpo?.error ?? `HTTP ${res.status}`)
      setAviso({ tom: 'ok', texto: 'Catálogo sincronizado com a Magalu.' })
      carregar()
    } catch (e) {
      setAviso({ tom: 'erro', texto: `Não foi possível sincronizar: ${e.message}` })
    } finally {
      setSincronizando(false)
    }
  }, [contaId, supabaseUrl, supabaseAnonKey, carregar])

  return {
    rows,
    diagnostico,
    desde: daConta ? estado.desde : null,
    podeVerValores: gestao.podeVerValores,
    cfg: gestao.cfg,
    loading: loading || gestao.loading || (!!contaId && !daConta),
    error: daConta ? (estado.error ?? gestao.error) : null,
    avisoVendas: daConta ? estado.avisoVendas : null,
    aviso, puxandoCustos, sincronizando,
    puxarCustos, sincronizar, refetch, isConnected,
    salvarCusto: gestao.salvarCusto,
  }
}
