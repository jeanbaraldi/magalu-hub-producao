import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos, lerSkus } from '../magalu/magaluDb'
import { agregarPorSku } from '../magalu/itens'
import { inicioDoPeriodo } from '../magalu/vendas'
import { useGestaoConfig } from '../magalu/useGestaoConfig'
import { JANELA_VENDAS_DIAS } from './produtos.constants'
import { mapProdutos, resumoCustos } from './produtos.mapper'

/** Único ponto de fetch de Produtos: catálogo + pedidos de 30 dias + custos cadastrados. */
export function useProdutosData() {
  const { contaId, isConnected } = useApp()
  const gestao = useGestaoConfig()
  const [estado, setEstado] = useState({ conta: null, skus: [], vendas: null, error: null, avisoVendas: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    const [skus, pedidos] = await Promise.allSettled([
      lerSkus(contaId),
      lerPedidos(contaId, inicioDoPeriodo(JANELA_VENDAS_DIAS)),
    ])
    if (meu !== pedido.current) return
    setEstado({
      conta: contaId,
      skus: skus.status === 'fulfilled' ? skus.value : [],
      error: skus.status === 'rejected' ? skus.reason?.message ?? String(skus.reason) : null,
      vendas: pedidos.status === 'fulfilled' ? agregarPorSku(pedidos.value) : null,
      avisoVendas: pedidos.status === 'rejected' ? `Vendas de 30 dias indisponíveis: ${pedidos.reason?.message ?? pedidos.reason}` : null,
    })
    setLoading(false)
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  const daConta = estado.conta === contaId
  const rows = useMemo(
    () => (daConta ? mapProdutos(estado.skus, gestao.custos, estado.vendas, { podeVerValores: gestao.podeVerValores }) : []),
    [daConta, estado.skus, estado.vendas, gestao.custos, gestao.podeVerValores],
  )
  const resumo = useMemo(() => resumoCustos(rows), [rows])
  const catalogo = useMemo(() => new Set(rows.map((r) => r.sku)), [rows])

  /** Grava em sequência; devolve { ok, falhas:[{sku, erro}] }. Nunca para no primeiro erro. */
  const importarCustos = useCallback(async (linhas) => {
    const falhas = []
    let ok = 0
    for (const l of linhas) {
      try { await gestao.salvarCusto(l.sku, l.custo); ok++ } catch (e) { falhas.push({ sku: l.sku, erro: e.message }) }
    }
    return { ok, falhas }
  }, [gestao])

  const refetch = useCallback(() => { carregar(); gestao.refetch() }, [carregar, gestao])

  return {
    rows, resumo, catalogo,
    semSku: daConta ? estado.vendas?.semSku ?? 0 : 0,
    podeVerValores: gestao.podeVerValores,
    loading: loading || gestao.loading || (!!contaId && !daConta),
    error: daConta ? (estado.error ?? gestao.error) : null,
    avisoVendas: daConta ? estado.avisoVendas : null,
    salvarCusto: gestao.salvarCusto,
    importarCustos, refetch, isConnected,
  }
}
