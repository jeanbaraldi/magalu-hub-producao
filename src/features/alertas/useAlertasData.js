import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerPedidos, lerSkus, ultimaSincronizacao } from '../magalu/magaluDb'
import { inicioDoPeriodo } from '../magalu/vendas'
import { useGestaoConfig } from '../magalu/useGestaoConfig'
import { JANELA_DIAS } from './alertas.constants'
import { diagnosticar } from './alertas.mapper'

/** Único ponto de fetch de Alertas: lê os espelhos e monta o diagnóstico no cliente. */
export function useAlertasData() {
  const { contaId, isConnected } = useApp()
  const g = useGestaoConfig()
  const [estado, setEstado] = useState({ conta: null, dados: null, error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const agora = new Date()
      const limites = { desde7: inicioDoPeriodo(7, agora), desde14: inicioDoPeriodo(14, agora) }
      const [skus, pedidos, syncOrders, syncSkus] = await Promise.all([
        lerSkus(contaId),
        lerPedidos(contaId, inicioDoPeriodo(JANELA_DIAS, agora)),
        ultimaSincronizacao(contaId, 'orders'),
        ultimaSincronizacao(contaId, 'skus'),
      ])
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, dados: { skus, pedidos, limites, agora, syncs: { orders: syncOrders, skus: syncSkus } }, error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, dados: null, error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  const daConta = estado.conta === contaId
  const prontoGestao = !g.loading
  const diagnostico = useMemo(() => {
    if (!daConta || !estado.dados || !prontoGestao) return null
    return diagnosticar({ ...estado.dados, custos: g.custos, cfg: g.cfg, podeVerValores: g.podeVerValores && !g.error })
  }, [daConta, estado.dados, prontoGestao, g.custos, g.cfg, g.podeVerValores, g.error])

  const refetch = useCallback(() => { carregar(); g.refetch() }, [carregar, g])

  return {
    diagnostico,
    avisoGestao: daConta && g.error ? `Custos e configuração não puderam ser lidos (${g.error}); esses alertas ficaram de fora.` : null,
    loading: loading || g.loading || (!!contaId && !daConta),
    error: daConta ? estado.error : null,
    refetch, isConnected,
  }
}
