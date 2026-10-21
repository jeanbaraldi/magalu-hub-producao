import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { DEFAULT_PERIOD } from './relatorios.constants'
import { mapRelatorio } from './relatorios.mapper'

/** Único ponto de fetch de Relatórios: pedidos dos últimos 2×N dias BRT (atual + anterior). */
export function useRelatoriosData() {
  const { contaId, isConnected } = useApp()
  const [dias, setDias] = useState(DEFAULT_PERIOD)
  const [estado, setEstado] = useState({ chave: null, pedidos: [], agora: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)
  const chave = `${contaId}:${dias}`

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    const k = `${contaId}:${dias}`
    const agora = new Date()
    setLoading(true)
    try {
      const linhas = await lerPedidos(contaId, inicioDoPeriodo(dias * 2, agora))
      if (meu !== pedido.current) return
      setEstado({ chave: k, pedidos: linhas, agora, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ chave: k, pedidos: [], agora, error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId, dias])

  useEffect(() => { carregar() }, [carregar])

  // Nunca expõe dado de outra loja (nem de outro período) durante a troca.
  const atual = estado.chave === chave
  const vm = useMemo(
    () => mapRelatorio({ pedidos: atual ? estado.pedidos : [], dias, agora: atual && estado.agora ? estado.agora : new Date() }),
    [atual, estado, dias]
  )

  return {
    vm, dias, setDias,
    vazio: atual && estado.pedidos.length === 0,
    loading: loading || (!!contaId && !atual),
    error: atual ? estado.error : null,
    refetch: carregar, isConnected,
  }
}
