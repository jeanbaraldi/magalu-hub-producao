import { useState, useRef, useEffect, useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { cn } from '../../../lib/utils'

const initialOf = (user) =>
  user?.user_metadata?.full_name?.[0]?.toUpperCase()
  ?? user?.email?.[0]?.toUpperCase()
  ?? 'U'

const nameOf = (user) =>
  user?.user_metadata?.full_name
  ?? user?.email?.split('@')[0]
  ?? 'Proprietário'

/**
 * Rodapé com avatar + nome/email + LogOut.
 * Recolhido: só avatar; click abre popover lateral com nome/email + Sair.
 *
 * @param {{ user: object, signOut: () => void, isExpanded: boolean }} props
 */
export default function SidebarUserFooter({ user, signOut, isExpanded }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [open, close])

  const initials = initialOf(user)
  const name = nameOf(user)
  const email = user?.email ?? ''

  if (isExpanded) {
    return (
      <div className="px-3 pb-3 border-t border-white/8 pt-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-mg-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{name}</p>
            <p className="text-slate-400 text-xs truncate">{email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sair da conta"
            title="Sair da conta"
            className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
    )
  }

  // Recolhido: avatar + popover
  return (
    <div ref={wrapRef} className="relative px-3 pb-3 border-t border-white/8 pt-3 flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Usuário: ${name}`}
        className={cn(
          'w-10 h-10 rounded-full bg-mg-blue text-white font-bold text-sm flex items-center justify-center',
          'hover:bg-mg-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60 transition-colors',
        )}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-full ml-2 bottom-0 z-50 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-elevated p-3"
        >
          <div className="px-1 pb-2 border-b border-slate-700 mb-2">
            <p className="text-white text-sm font-medium truncate">{name}</p>
            <p className="text-slate-400 text-xs truncate">{email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut aria-hidden="true" size={14} />
            Sair da conta
          </button>
        </div>
      )}
    </div>
  )
}
