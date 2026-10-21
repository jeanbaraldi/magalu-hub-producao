import { useMemo, useState } from 'react'
import { useBaseVendas } from './useBaseVendas'
import { DEFAULT_PERIOD, TENDENCIA_DIAS } from './performance.constants'
import { mapPerformance } from './performance.mapper'

/** Único ponto de fetch da Performance: período escolhido + 14 dias para a tendência. */
export function usePerformanceData() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const base = useBaseVendas(Math.max(period, TENDENCIA_DIAS * 2))
  const vm = useMemo(() => mapPerformance({
    pedidos: base.pedidos, skus: base.skus, custos: base.custos, cfg: base.cfg,
    podeVerValores: base.podeVerValores, dias: period, agora: base.agora,
  }), [base.pedidos, base.skus, base.custos, base.cfg, base.podeVerValores, period, base.agora])

  return {
    ...vm, period, setPeriod,
    cfg: base.cfg, podeVerValores: base.podeVerValores,
    loading: base.loading, error: base.error, refetch: base.refetch, isConnected: base.isConnected,
  }
}
