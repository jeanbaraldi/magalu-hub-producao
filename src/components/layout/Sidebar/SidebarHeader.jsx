// src/components/layout/Sidebar/SidebarHeader.jsx
import { ShoppingCart, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import SidebarPinButton from './SidebarPinButton'

/**
 * Header: logo (quadrado amarelo + ShoppingCart) + nome/subtítulo (fade) + pin button.
 * No mobile (drawer), inclui o botão X de fechar.
 *
 * @param {{
 *   isExpanded: boolean,
 *   mode: import('./sidebar.types').SidebarMode,
 *   onTogglePin: () => void,
 *   onCloseMobile?: () => void,
 * }} props
 */
export default function SidebarHeader({ isExpanded, mode, onTogglePin, onCloseMobile }) {
  return (
    <div className={cn('py-4 border-b border-white/8 flex items-center', isExpanded ? 'px-5 gap-3' : 'px-3 justify-center')}>
      <div className="w-9 h-9 bg-mg-blue rounded-lg flex items-center justify-center flex-shrink-0">
        <ShoppingCart aria-hidden="true" size={18} className="text-white" strokeWidth={2.5} />
      </div>

      {/* Textos com fade */}
      <div
        className={cn(
          'min-w-0 overflow-hidden whitespace-nowrap transition-all duration-150',
          isExpanded
            ? 'flex-1 opacity-100 translate-x-0'
            : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
        )}
      >
        <p className="text-white font-bold text-sm leading-none">Gestor Magalu</p>
        <p className="text-slate-400 text-xs mt-0.5">Magazine Luiza</p>
      </div>

      {/* Pin button — desktop only (lg+); oculto no collapsed (não cabe em 76px com o logo) */}
      {isExpanded && (
        <SidebarPinButton mode={mode} onClick={onTogglePin} className="hidden lg:inline-flex flex-shrink-0" />
      )}

      {/* Close mobile drawer */}
      {onCloseMobile && (
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Fechar menu"
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  )
}
