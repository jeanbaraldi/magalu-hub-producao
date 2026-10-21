import { useApp } from '../../context/AppContext'
import { useGestaoConfig } from '../magalu/useGestaoConfig'

/** Único ponto de dados de Impostos: a configuração financeira da loja ativa. */
export function useImpostosData() {
  const { conta, contaId, isConnected } = useApp()
  const g = useGestaoConfig()
  return {
    contaId,
    lojaNome: conta?.nickname ?? contaId ?? null,
    cfg: g.cfg,
    podeVerValores: g.podeVerValores,
    loading: g.loading,
    error: g.error,
    salvarConfig: g.salvarConfig,
    refetch: g.refetch,
    isConnected,
  }
}
