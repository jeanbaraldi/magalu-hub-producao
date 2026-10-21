import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerTudo } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { DEFAULT_PERIOD } from './pedidos.constants'
import { mapPedidoRow, mapPedidosKpis } from './pedidos.mapper'

/** Único ponto de fetch de Pedidos: lê o espelho `magalu.orders` da loja ativa. */
export function usePedidosData() {
  const { contaId, isConnected } = useApp()
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [estado, setEstado] = useState({ conta: null, rows: [], error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const desde = inicioDoPeriodo(period)
      const linhas = await lerTudo('orders', 'order_id, status, purchased_at, total_amount, items_count, payload',
        (q) => q.eq('account_id', contaId).gte('purchased_at', desde)
          .order('purchased_at', { ascending: false }).order('order_id', { ascending: true }))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: linhas.map(mapPedidoRow), error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: [], error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId, period])

  useEffect(() => { carregar() }, [carregar])

  // Nunca expõe pedidos de outra loja durante a troca.
  const rows = estado.conta === contaId ? estado.rows : []
  const kpis = useMemo(() => mapPedidosKpis(rows), [rows])

  return {
    rows, kpis, period, setPeriod,
    loading: loading || (contaId && estado.conta !== contaId),
    error: estado.conta === contaId ? estado.error : null,
    refetch: carregar, isConnected,
  }
}
