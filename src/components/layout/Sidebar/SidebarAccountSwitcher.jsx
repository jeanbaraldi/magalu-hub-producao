// src/components/layout/Sidebar/SidebarAccountSwitcher.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../../../lib/utils'
import { useApp } from '../../../context/AppContext'
import { useSellerOrder } from '../../../hooks/useSellerOrder'
import AccountSwitcher, { AccountList } from '../AccountSwitcher'

const sellerIdOf = (s) => String(s.id ?? s.seller_id)
const initials = (name) => ((name ?? '').trim().slice(0, 2).toUpperCase() || '?')

/**
 * Wrapper do AccountSwitcher para a nova sidebar.
 * - isExpanded: renderiza o AccountSwitcher original (sem alterações).
 * - recolhido: avatar 40px que abre popover lateral à direita com o mesmo grid 2-col.
 *
 * @param {{ isExpanded: boolean, onSelect?: () => void }} props
 */
export default function SidebarAccountSwitcher({ isExpanded, onSelect }) {
  const { sellers, activeSellerId, selectSeller } = useApp()
  const { orderedSellers, reorder, moveUp, moveDown } = useSellerOrder(sellers)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const wrapRef = useRef(null)

  const close = useCallback(() => { setOpen(false); setEditing(false) }, [])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [open, close])

  if (sellers.length <= 1) return null
  if (isExpanded) return <AccountSwitcher onSelect={onSelect} />

  const resolvedActiveId = activeSellerId ?? (orderedSellers[0] ? sellerIdOf(orderedSellers[0]) : null)
  const activeSeller = orderedSellers.find((s) => sellerIdOf(s) === resolvedActiveId) ?? orderedSellers[0]
  if (!activeSeller) return null

  const handleSelect = (id) => { selectSeller(id); close(); onSelect?.() }

  return (
    <div ref={wrapRef} className="relative px-3 py-2 border-b border-white/8 flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Conta ativa: ${activeSeller.nickname ?? resolvedActiveId}`}
        className={cn(
          'w-10 h-10 rounded-lg bg-mg-blue text-white flex items-center justify-center text-xs font-bold transition-colors',
          'hover:bg-mg-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60',
        )}
      >
        {initials(activeSeller.nickname)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-full ml-2 top-0 z-50 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-elevated p-3"
        >
          <AccountList
            orderedSellers={orderedSellers}
            resolvedActiveId={resolvedActiveId}
            editing={editing}
            onToggleEditing={() => setEditing((e) => !e)}
            onSelect={handleSelect}
            reorder={reorder}
            moveUp={moveUp}
            moveDown={moveDown}
          />
        </div>
      )}
    </div>
  )
}
