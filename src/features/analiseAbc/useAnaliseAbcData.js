import { useMemo, useState } from 'react'
import { useBaseVendas } from '../performance/useBaseVendas'
import { DEFAULT_PERIOD, DEFAULT_METRICA } from './analiseAbc.constants'
import { mapAnaliseAbc } from './analiseAbc.mapper'

/** Único ponto de fetch da Análise ABC: lê 2 × o período (atual + anterior). */
export function useAnaliseAbcData() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [metrica, setMetrica] = useState(DEFAULT_METRICA)
  const base = useBaseVendas(period * 2)
  const vm = useMemo(
    () => mapAnaliseAbc({ pedidos: base.pedidos, skus: base.skus, dias: period, agora: base.agora, metrica }),
    [base.pedidos, base.skus, period, base.agora, metrica],
  )
  return { ...vm, period, setPeriod, metrica, setMetrica, loading: base.loading, error: base.error, refetch: base.refetch, isConnected: base.isConnected }
}
