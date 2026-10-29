import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { dispararSync, lerPedidos, lerTudo } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { agregarPorSku } from '../magalu/itens'
import { useGestaoConfig } from '../magalu/useGestaoConfig'
import { enriquecerSkus, mapSkuRow, mapSkusResumo } from './anuncios.mapper'
import { JANELA_VENDAS_DIAS } from './anuncios.constants'

/** Erro que o magalu-sync devolve DENTRO de um 200, para a loja pedida. */
function erroDaLoja(corpo, contaId) {
  const conta = corpo?.accounts?.find((a) => String(a.account_id) === String(contaId))
  if (!conta) return 'a sincronização não devolveu esta loja'
  return conta.error ?? conta.skus?.error ?? (conta.skipped ? `pulada (${conta.skipped})` : null)
}

/**
 * Único ponto de fetch de Anúncios: catálogo `magalu.skus`, pedidos dos últimos 30 dias
 * (vendidos e comissão real por SKU) e custos/config da loja (via useGestaoConfig).
 */
export function useAnunciosData() {
  const { contaId, isConnected, supabaseUrl, supabaseAnonKey } = useApp()
  const gestao = useGestaoConfig()
  const [estado, setEstado] = useState({ conta: null, skus: [], vendas: new Map(), error: null })
  const [loading, setLoading] = useState(false)
  const [sync, setSync] = useState({ conta: null, rodando: false, resultado: null })
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const [skus, pedidos] = await Promise.all([
        // Só os campos do payload que o card usa: o payload inteiro (com descrição e ficha)
        // passa de 5 MB numa loja de 2.300 SKUs.
        lerTudo('skus', 'sku, title, status, price, list_price, stock, image_url, synced_at, '
          + 'images:payload->images, videos:payload->videos, brand:payload->brand, group:payload->group, '
          + 'fulfillment:payload->fulfillment, url_marketplace:payload->url_marketplace',
          (q) => q.eq('account_id', contaId).order('sku', { ascending: true })),
        lerPedidos(contaId, inicioDoPeriodo(JANELA_VENDAS_DIAS)),
      ])
      if (meu !== pedido.current) return
      const { linhas } = agregarPorSku(pedidos)
      setEstado({ conta: contaId, skus: skus.map(mapSkuRow), vendas: new Map(linhas.map((l) => [l.sku, l])), error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, skus: [], vendas: new Map(), error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  /** Puxa o portfólio (títulos, status, preço e estoque) da Magalu e relê. */
  const sincronizar = useCallback(async () => {
    if (!contaId) return
    const conta = contaId
    setSync({ conta, rodando: true, resultado: null })
    try {
      const corpo = await dispararSync({ supabaseUrl, anonKey: supabaseAnonKey, accountId: conta, kind: 'skus', days: 1 })
      const skus = corpo?.accounts?.find((a) => String(a.account_id) === String(conta))?.skus
      setSync({ conta, rodando: false, resultado: { ok: !erroDaLoja(corpo, conta), erro: erroDaLoja(corpo, conta), parcial: !!skus?.truncated } })
    } catch (e) {
      setSync({ conta, rodando: false, resultado: { ok: false, erro: e.message } })
    }
    carregar()
  }, [contaId, supabaseUrl, supabaseAnonKey, carregar])

  const daConta = estado.conta === contaId
  // Papel que falhou ao ler não esconde custos que a RLS já entregou: a trava é o banco.
  const podeVerValores = gestao.podeVerValores || gestao.custos.size > 0
  const rows = useMemo(
    () => (daConta ? enriquecerSkus(estado.skus, { vendas: estado.vendas, custos: gestao.custos, cfg: gestao.cfg, reais: gestao.reais, podeVerValores }) : []),
    [daConta, estado, gestao.custos, gestao.cfg, gestao.reais, podeVerValores],
  )
  const resumo = useMemo(() => mapSkusResumo(rows), [rows])
  const syncAtual = sync.conta === contaId

  return {
    rows,
    resumo,
    cfg: gestao.cfg,
    podeVerValores,
    loading: loading || gestao.loading || (!!contaId && !daConta),
    error: (daConta ? estado.error : null) ?? gestao.error,
    sincronizando: syncAtual && sync.rodando,
    resultadoSync: syncAtual ? sync.resultado : null,
    sincronizar,
    refetch: () => { carregar(); gestao.refetch() },
    isConnected,
  }
}
