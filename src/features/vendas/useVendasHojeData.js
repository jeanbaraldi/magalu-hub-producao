import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { mapVendasHoje } from './vendas.mapper'
import { REFRESH_MS } from './vendas.constants'

/**
 * Único ponto de fetch de Vendas Hoje: pedidos de ontem 00:00 BRT até agora.
 * Auto-atualiza a cada 60 s; o intervalo é limpo ao desmontar ou trocar de loja.
 */
export function useVendasHojeData() {
  const { contaId, isConnected } = useApp()
  const [estado, setEstado] = useState({ conta: null, pedidos: [], agora: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    const agora = new Date()
    setLoading(true)
    try {
      const linhas = await lerPedidos(contaId, inicioDoPeriodo(2, agora))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, pedidos: linhas, agora, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      // Erro numa atualização automática não apaga o que já estava na tela da MESMA loja.
      setEstado((ant) => (ant.conta === contaId
        ? { ...ant, error: e.message }
        : { conta: contaId, pedidos: [], agora, error: e.message }))
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => {
    carregar()
    if (!contaId) return undefined
    const id = setInterval(carregar, REFRESH_MS)
    return () => clearInterval(id)
  }, [carregar, contaId])

  // Nunca expõe pedidos de outra loja durante a troca.
  const atual = estado.conta === contaId
  const vm = useMemo(
    () => mapVendasHoje(atual ? estado.pedidos : [], atual && estado.agora ? estado.agora : new Date()),
    [atual, estado]
  )

  return {
    vm,
    atualizadoEm: atual ? estado.agora : null,
    loading: loading || (!!contaId && !atual),
    error: atual ? estado.error : null,
    refetch: carregar,
    isConnected,
  }
}
