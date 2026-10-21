import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerTudo, ultimaSincronizacao } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { mapDashboard } from './dashboard.mapper'

/** Único ponto de fetch do Dashboard: pedidos do período + SKUs + última sincronização. */
export function useDashboardData() {
  const { contaId, isConnected } = useApp()
  const [dias, setDias] = useState(30)
  const [estado, setEstado] = useState({ chave: null, pedidos: [], skus: [], sync: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)
  const chave = `${contaId}:${dias}`

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    const k = `${contaId}:${dias}`
    setLoading(true)
    try {
      const desde = inicioDoPeriodo(dias)
      const [pedidos, skus, sync] = await Promise.all([
        lerTudo('orders', 'order_id, status, purchased_at, total_amount',
          (q) => q.eq('account_id', contaId).gte('purchased_at', desde)
            .order('purchased_at', { ascending: true }).order('order_id', { ascending: true })),
        lerTudo('skus', 'sku, status, stock', (q) => q.eq('account_id', contaId).order('sku', { ascending: true })),
        ultimaSincronizacao(contaId, 'orders'),
      ])
      if (meu !== pedido.current) return
      setEstado({ chave: k, pedidos, skus, sync, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ chave: k, pedidos: [], skus: [], sync: null, error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId, dias])

  useEffect(() => { carregar() }, [carregar])

  const atual = estado.chave === chave
  const vm = useMemo(
    () => mapDashboard({ pedidos: atual ? estado.pedidos : [], skus: atual ? estado.skus : [], dias }),
    [atual, estado, dias]
  )
  return {
    vm, dias, setDias,
    ultimaSync: atual ? estado.sync : null,
    vazio: atual && estado.pedidos.length === 0 && estado.skus.length === 0,
    loading: loading || (contaId && !atual),
    error: atual ? estado.error : null,
    refetch: carregar, isConnected,
  }
}
