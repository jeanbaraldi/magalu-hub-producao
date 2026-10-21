import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { lerTudo } from '../magalu/magaluDb'
import { mapSkuRow, mapSkusResumo } from './anuncios.mapper'

/** Único ponto de fetch de Anúncios: lê o espelho `magalu.skus` da loja ativa. */
export function useAnunciosData() {
  const { contaId, isConnected } = useApp()
  const [estado, setEstado] = useState({ conta: null, rows: [], error: null })
  const [loading, setLoading] = useState(false)
  const pedido = useRef(0)

  const carregar = useCallback(async () => {
    if (!contaId) return
    const meu = ++pedido.current
    setLoading(true)
    try {
      const linhas = await lerTudo('skus', 'sku, title, status, price, list_price, stock, image_url, synced_at',
        (q) => q.eq('account_id', contaId).order('sku', { ascending: true }))
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: linhas.map(mapSkuRow), error: null })
    } catch (e) {
      if (meu !== pedido.current) return
      setEstado({ conta: contaId, rows: [], error: e.message })
    } finally {
      if (meu === pedido.current) setLoading(false)
    }
  }, [contaId])

  useEffect(() => { carregar() }, [carregar])

  const rows = estado.conta === contaId ? estado.rows : []
  const resumo = useMemo(() => mapSkusResumo(rows), [rows])
  return {
    rows, resumo,
    loading: loading || (contaId && estado.conta !== contaId),
    error: estado.conta === contaId ? estado.error : null,
    refetch: carregar, isConnected,
  }
}
