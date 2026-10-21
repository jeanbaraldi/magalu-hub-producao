// src/components/layout/Sidebar/SidebarPinButton.jsx
import { Pin, PinOff } from 'lucide-react'
import { cn } from '../../../lib/utils'

/**
 * Botão que alterna mode 'expanded' ↔ 'collapsed'.
 *
 * @param {{
 *   mode: import('./sidebar.types').SidebarMode,
 *   onClick: () => void,
 *   className?: string,
 * }} props
 */
export default function SidebarPinButton({ mode, onClick, className }) {
  const isPinned = mode === 'expanded'
  const Icon = isPinned ? Pin : PinOff
  const label = isPinned ? 'Recolher menu' : 'Fixar menu expandido'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={!isPinned}
      title={label}
      className={cn(
        'p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60',
        className,
      )}
    >
      <Icon aria-hidden="true" size={15} strokeWidth={2} />
    </button>
  )
}
