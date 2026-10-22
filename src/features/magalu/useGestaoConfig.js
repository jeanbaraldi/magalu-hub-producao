import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { lerTudo } from './magaluDb'
import { custosReaisPorSku, pesoCobradoG } from './margem'

/**
 * Custos por SKU (`magalu.sku_costs`) e configuração financeira da loja
 * (`magalu.account_settings`). Compartilhado por Produtos, Impostos, Performance,
 * Rentabilidade e Lucratividade.
 *
 * Sob RLS, quem não é admin/financeiro recebe LISTA VAZIA, não erro: por isso
 * `podeVerValores` vem junto e a tela diz "seu acesso não inclui custos".
 */
export function useGestaoConfig() {
  const { contaId } = useApp()
  const [estado, setEstado] = useState({ conta: null, custos: new Map(), cfg: null, reais: null, error: null })
  const [loading, setLoading] = useState(false)
  const [papel, setPapel] = useState(null)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const [custos, cfgRes, papelRes, reaisRes, dims] = await Promise.all([
        lerTudo('sku_costs', 'sku, cost, updated_at', (q) => q.eq('account_id', contaId).order('sku', { ascending: true })),
        supabase.from('account_settings').select('tax_regime, tax_pct, commission_pct, freight_pct, updated_at').eq('account_id', contaId).maybeSingle(),
        supabase.rpc('papel_atual'),
        // Frete e intermediação medidos na análise financeira da Magalu (12 meses).
        // Falha aqui não derruba a tela: a margem cai no frete% configurado.
        lerTudo('v_custos_reais_sku', 'sku, unidades_vendidas, venda, frete, mdr, comissao',
          (q) => q.eq('account_id', contaId).order('sku', { ascending: true })).catch(() => null),
        // Peso/medidas da embalagem: base da estimativa de frete de SKU que nunca vendeu.
        lerTudo('skus', 'sku, dimensions:payload->dimensions',
          (q) => q.eq('account_id', contaId).order('sku', { ascending: true })).catch(() => []),
      ])
      const pesos = new Map()
      for (const d of dims) { const g = pesoCobradoG(d.dimensions); if (g != null) pesos.set(String(d.sku), g) }
      if (meu !== pedido.current) return
      if (cfgRes.error) throw new Error(cfgRes.error.message)
      setPapel(papelRes.error ? null : papelRes.data)
      setEstado({
        conta: contaId,
        custos: new Map(custos.map((c) => [c.sku, Number(c.cost)])),
        cfg: cfgRes.data ?? null,
        reais: reaisRes ? custosReaisPorSku(reaisRes, pesos) : null,
        error: null,
      })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, custos: new Map(), cfg: null, reais: null, error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  /** Grava (ou apaga, com valor vazio) o custo de um SKU. */
  const salvarCusto = useCallback(async (sku, valor) => {
    if (!contaId) return
    const n = valor === '' || valor == null ? null : Number(String(valor).replace(',', '.'))
    if (n != null && (!Number.isFinite(n) || n < 0)) throw new Error('Custo inválido')
    const { error } = n == null
      ? await supabase.from('sku_costs').delete().eq('account_id', contaId).eq('sku', sku)
      : await supabase.from('sku_costs').upsert({ account_id: contaId, sku, cost: n, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    setEstado((s) => {
      if (s.conta !== contaId) return s
      const custos = new Map(s.custos)
      if (n == null) custos.delete(sku); else custos.set(sku, n)
      return { ...s, custos }
    })
  }, [contaId])

  /** Grava a configuração financeira (campos ausentes ficam como estão). */
  const salvarConfig = useCallback(async (campos) => {
    if (!contaId) return
    const linha = { account_id: contaId, ...estado.cfg, ...campos, updated_at: new Date().toISOString() }
    delete linha.conta
    const { data, error } = await supabase.from('account_settings').upsert(linha).select('tax_regime, tax_pct, commission_pct, freight_pct, updated_at').single()
    if (error) throw new Error(error.message)
    setEstado((s) => (s.conta === contaId ? { ...s, cfg: data } : s))
  }, [contaId, estado.cfg])

  const daConta = estado.conta === contaId
  return {
    custos: daConta ? estado.custos : new Map(),
    cfg: daConta ? estado.cfg : null,
    /** { porSku: Map, mdrPctLoja } medido na Magalu, ou null (não lido / sem acesso). */
    reais: daConta ? estado.reais : null,
    papel,
    podeVerValores: papel === 'admin' || papel === 'financeiro',
    loading: loading || (!!contaId && !daConta),
    error: daConta ? estado.error : null,
    salvarCusto, salvarConfig, refetch: carregar,
  }
}
