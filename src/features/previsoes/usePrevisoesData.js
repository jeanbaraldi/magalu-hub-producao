import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { DEFAULT_HORIZON, DIAS_BASE } from './previsoes.constants'
import { mapPrevisoes } from './previsoes.mapper'

/**
 * Único ponto de fetch de Previsões: pedidos dos 90 dias FECHADOS (meia-noite BRT de
 * 90 dias atrás até a meia-noite de hoje). Trocar o horizonte não busca de novo.
 */
export function usePrevisoesData() {
  const { contaId, isConnected } = useApp()
  const [horizonte, setHorizonte] = useState(DEFAULT_HORIZON)
  const [estado, setEstado] = useState({ conta: null, pedidos: [], agora: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    const agora = new Date()
    setLoading(true)
    try {
      // inicioDoPeriodo(91) = 00:00 BRT de 90 dias antes de hoje; inicioDoPeriodo(1) = 00:00 BRT de hoje.
      const linhas = await lerPedidos(contaId, inicioDoPeriodo(DIAS_BASE + 1, agora), inicioDoPeriodo(1, agora))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, pedidos: linhas, agora, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, pedidos: [], agora, error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  // Nunca expõe dado de outra loja durante a troca.
  const atual = estado.conta === contaId
  const vm = useMemo(
    () => mapPrevisoes({ pedidos: atual ? estado.pedidos : [], horizonte, agora: atual && estado.agora ? estado.agora : new Date() }),
    [atual, estado, horizonte]
  )

  return {
    vm, horizonte, setHorizonte,
    loading: loading || (!!contaId && !atual),
    error: atual ? estado.error : null,
    refetch: carregar, isConnected,
  }
}
