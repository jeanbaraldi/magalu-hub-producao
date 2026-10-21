import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Pencil, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp } from '../../context/AppContext'
import { useSellerOrder } from '../../hooks/useSellerOrder'

const sellerId = (s) => String(s.id ?? s.seller_id)
const initials = (name) => ((name ?? '').trim().slice(0, 2).toUpperCase() || '?')

/**
 * Switcher de contas em grid 2-col com reordenação (DnD nativo + ↑/↓).
 * Só renderiza com 2+ contas. `onSelect` é chamado após trocar (fecha sidebar no mobile).
 * @param {{ onSelect?: () => void }} props
 */
export default function AccountSwitcher({ onSelect }) {
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

  const resolvedActiveId = activeSellerId ?? (orderedSellers[0] ? sellerId(orderedSellers[0]) : null)
  const activeSeller = orderedSellers.find((s) => sellerId(s) === resolvedActiveId) ?? orderedSellers[0]
  if (!activeSeller) return null

  const handleSelect = (id) => { selectSeller(id); close(); onSelect?.() }

  return (
    <div ref={wrapRef} className="relative px-3 py-2 border-b border-slate-800">
      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5">Conta ativa</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60"
      >
        <span aria-hidden="true" className="w-7 h-7 rounded-lg bg-mg-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials(activeSeller.nickname)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-white truncate">{activeSeller.nickname ?? resolvedActiveId}</span>
          <span className="block text-[10px] text-slate-400">Conta ativa</span>
        </span>
        <ChevronDown aria-hidden="true" size={15} className={cn('text-slate-500 transition-transform flex-shrink-0', open && 'rotate-180 text-mg-blue')} />
      </button>

      {open && (
        <div role="menu" className="absolute left-3 right-3 top-full mt-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-elevated p-3">
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

/**
 * Grid 2-col de contas com DnD + ↑/↓. Reusável fora do dropdown do AccountSwitcher
 * (ex: popover do SidebarAccountSwitcher no modo recolhido).
 * @param {{
 *   orderedSellers: object[],
 *   resolvedActiveId: string,
 *   editing: boolean,
 *   onToggleEditing: () => void,
 *   onSelect: (id: string) => void,
 *   reorder: (fromId: string, toId: string) => void,
 *   moveUp: (id: string) => void,
 *   moveDown: (id: string) => void,
 * }} props
 */
export function AccountList({
  orderedSellers, resolvedActiveId, editing, onToggleEditing,
  onSelect, reorder, moveUp, moveDown,
}) {
  const [dragId, setDragId] = useState(null)
  return (
    <>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{editing ? 'Arraste ou use ↑/↓' : 'Alternar conta'}</span>
        <button
          type="button"
          onClick={onToggleEditing}
          aria-pressed={editing}
          aria-label={editing ? 'Concluir ordenação' : 'Ordenar contas'}
          className={cn('p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60', editing ? 'bg-mg-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700')}
        >
          <Pencil aria-hidden="true" size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {orderedSellers.map((seller, idx) => {
          const id = sellerId(seller)
          const isActive = id === resolvedActiveId
          const cardCls = cn(
            'relative rounded-lg border p-3 flex flex-col items-center gap-1.5 text-center transition-colors',
            isActive ? 'bg-mg-blue/10 border-mg-blue/40' : 'bg-slate-900/40 border-slate-700',
            editing ? 'border-dashed cursor-grab active:cursor-grabbing' : 'hover:bg-slate-700/60 cursor-pointer',
            dragId === id && 'opacity-40',
          )
          const inner = (
            <>
              <span aria-hidden="true" className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold', isActive ? 'bg-mg-blue text-white' : 'bg-slate-700 text-slate-300')}>
                {initials(seller.nickname)}
              </span>
              <span className={cn('text-[11px] font-medium truncate w-full', isActive ? 'text-white' : 'text-slate-400')}>{seller.nickname ?? id}</span>
              {isActive && !editing && <Check aria-hidden="true" size={12} className="absolute top-1.5 right-1.5 text-mg-blue" />}
            </>
          )

          if (editing) {
            return (
              <div
                key={id}
                draggable
                onDragStart={() => setDragId(id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, id); setDragId(null) }}
                onDragEnd={() => setDragId(null)}
                className={cardCls}
              >
                {inner}
                <div className="flex items-center gap-1 mt-0.5">
                  <button type="button" disabled={idx === 0} onClick={() => moveUp(id)} aria-label={`Mover ${seller.nickname ?? id} para cima`} className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mg-blue"><ArrowUp aria-hidden="true" size={12} /></button>
                  <button type="button" disabled={idx === orderedSellers.length - 1} onClick={() => moveDown(id)} aria-label={`Mover ${seller.nickname ?? id} para baixo`} className="p-0.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mg-blue"><ArrowDown aria-hidden="true" size={12} /></button>
                </div>
              </div>
            )
          }

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`Conta ${seller.nickname ?? id}${isActive ? ' (ativa)' : ''}`}
              className={cardCls}
            >
              {inner}
            </button>
          )
        })}
      </div>
    </>
  )
}
