import { useMemo, useState } from 'react'
import { useBaseVendas } from '../performance/useBaseVendas'
import { DEFAULT_PERIOD } from './rentabilidade.constants'
import { mapRentabilidade } from './rentabilidade.mapper'

/** Único ponto de fetch da Rentabilidade. */
export function useRentabilidadeData() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const base = useBaseVendas(period)
  const vm = useMemo(() => mapRentabilidade({
    pedidos: base.pedidos, custos: base.custos, cfg: base.cfg,
    podeVerValores: base.podeVerValores, dias: period, agora: base.agora,
  }), [base.pedidos, base.custos, base.cfg, base.podeVerValores, period, base.agora])
  return { ...vm, period, setPeriod, cfg: base.cfg, podeVerValores: base.podeVerValores, loading: base.loading, error: base.error, refetch: base.refetch, isConnected: base.isConnected }
}
