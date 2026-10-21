import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'gestor_magalu_account_order'

const sellerId = (s) => String(s.id ?? s.seller_id)

function loadOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

/**
 * Ordena `sellers` conforme preferência salva em localStorage e expõe mutações.
 * IDs salvos vêm primeiro (na ordem); sellers novos entram no fim.
 * @param {object[]} sellers
 * @returns {{ orderedSellers: object[], reorder: (fromId, toId) => void, moveUp: (id) => void, moveDown: (id) => void }}
 */
export function useSellerOrder(sellers) {
  const [order, setOrder] = useState(loadOrder) // array de IDs (string)

  const orderedSellers = useMemo(() => {
    const byId = new Map(sellers.map((s) => [sellerId(s), s]))
    const seen = new Set()
    const result = []
    for (const id of order) {
      const s = byId.get(id)
      if (s && !seen.has(id)) { result.push(s); seen.add(id) }
    }
    for (const s of sellers) {
      const id = sellerId(s)
      if (!seen.has(id)) { result.push(s); seen.add(id) }
    }
    return result
  }, [sellers, order])

  const persist = useCallback((ids) => {
    setOrder(ids)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
  }, [])

  const reorder = useCallback((fromId, toId) => {
    if (String(fromId) === String(toId)) return
    const ids = orderedSellers.map(sellerId)
    const from = ids.indexOf(String(fromId))
    const to = ids.indexOf(String(toId))
    if (from < 0 || to < 0) return
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    persist(ids)
  }, [orderedSellers, persist])

  const moveUp = useCallback((id) => {
    const ids = orderedSellers.map(sellerId)
    const i = ids.indexOf(String(id))
    if (i <= 0) return
    ;[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]
    persist(ids)
  }, [orderedSellers, persist])

  const moveDown = useCallback((id) => {
    const ids = orderedSellers.map(sellerId)
    const i = ids.indexOf(String(id))
    if (i < 0 || i >= ids.length - 1) return
    ;[ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]
    persist(ids)
  }, [orderedSellers, persist])

  return { orderedSellers, reorder, moveUp, moveDown }
}
