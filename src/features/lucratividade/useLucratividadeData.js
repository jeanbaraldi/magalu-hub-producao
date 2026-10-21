import { useMemo, useState } from 'react'
import { useBaseVendas } from '../performance/useBaseVendas'
import { DEFAULT_PERIOD } from './lucratividade.constants'
import { mapLucratividade } from './lucratividade.mapper'

/** Único ponto de fetch da Lucratividade. */
export function useLucratividadeData() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const base = useBaseVendas(period)
  const vm = useMemo(() => mapLucratividade({
    pedidos: base.pedidos, skus: base.skus, custos: base.custos, cfg: base.cfg,
    podeVerValores: base.podeVerValores, dias: period, agora: base.agora,
  }), [base.pedidos, base.skus, base.custos, base.cfg, base.podeVerValores, period, base.agora])
  return { ...vm, period, setPeriod, cfg: base.cfg, podeVerValores: base.podeVerValores, loading: base.loading, error: base.error, refetch: base.refetch, isConnected: base.isConnected }
}
