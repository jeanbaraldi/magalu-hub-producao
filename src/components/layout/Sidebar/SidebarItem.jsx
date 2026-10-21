// src/components/layout/Sidebar/SidebarItem.jsx
import { NavLink } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import SidebarBadge from './SidebarBadge'
import SidebarTooltip from './SidebarTooltip'

// Animação semântica do ícone por item (dispara 1× no group-hover do expandido).
// Strings literais completas pro JIT do Tailwind detectar as classes.
const ICON_ANIM_CLASS = {
  ring: 'group-hover:animate-icon-ring',
  tremor: 'group-hover:animate-icon-tremor',
  spin: 'group-hover:animate-icon-spin',
  wiggle: 'group-hover:animate-icon-wiggle',
  rise: 'group-hover:animate-icon-rise',
  pulse: 'group-hover:animate-icon-pulse',
  nod: 'group-hover:animate-icon-nod',
}
// Fallback pros itens sem iconAnim: spring com overshoot (comportamento original).
const ICON_ANIM_DEFAULT = 'group-hover:scale-110 group-hover:-rotate-[8deg]'

/**
 * Item de navegação — wraps NavLink com ícone, label (fade), badge, liveDot, statusDot.
 *
 * @param {{
 *   item: import('./sidebar.types').SidebarItemConfig,
 *   dynamicData: import('./sidebar.types').SidebarDynamicData,
 *   isExpanded: boolean,
 *   onNavigate?: () => void,
 * }} props
 */
export default function SidebarItem({ item, dynamicData, isExpanded, onNavigate }) {
  const Icon = item.icon
  const badgeValue = item.badgeFrom ? dynamicData[item.badgeFrom] : null
  const showBadge = typeof badgeValue === 'number' && badgeValue > 0
  const showLiveDot = item.liveDotFrom && Boolean(dynamicData[item.liveDotFrom])
  const showStatusDot = item.statusDotFrom && Boolean(dynamicData[item.statusDotFrom])
  const iconHoverAnim = ICON_ANIM_CLASS[item.iconAnim] ?? ICON_ANIM_DEFAULT

  const linkClass = ({ isActive }) =>
    cn(
      'group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue/60',
      isExpanded ? 'gap-3 px-3 py-2.5 w-full' : 'justify-center w-10 h-10 mx-auto',
      isActive
        ? 'bg-mg-blue text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-800',
    )

  return (
    <SidebarTooltip label={item.label} enabled={!isExpanded}>
      <NavLink
        to={item.href}
        end={item.href === '/dashboard'}
        className={linkClass}
        onClick={onNavigate}
        aria-label={item.label}
      >
        <span className="relative flex-shrink-0">
          <Icon
            aria-hidden="true"
            size={17}
            strokeWidth={2}
            className={cn(
              'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              isExpanded && iconHoverAnim,
            )}
          />
          {/* Dots no recolhido (badge/status sobre o ícone) */}
          {!isExpanded && showBadge && (
            <SidebarBadge value={badgeValue} tone={item.badgeTone} isExpanded={false} ariaLabel={`${badgeValue} ${item.label}`} />
          )}
          {!isExpanded && showStatusDot && (
            <span aria-hidden="true" className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-sidebar-bg" />
          )}
          {!isExpanded && showLiveDot && (
            <span aria-hidden="true" className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-sidebar-bg" />
          )}
        </span>

        {/* Label com fade */}
        <span
          className={cn(
            'min-w-0 truncate transition-all duration-150',
            isExpanded
              ? 'flex-1 opacity-100 translate-x-0'
              : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
          )}
        >
          {item.label}
        </span>

        {/* Badge expandido (à direita) */}
        {isExpanded && showBadge && (
          <SidebarBadge value={badgeValue} tone={item.badgeTone} isExpanded ariaLabel={`${badgeValue} ${item.label}`} />
        )}

        {/* Live dot no expandido */}
        {isExpanded && showLiveDot && (
          <span role="status" aria-label="Ao vivo" className="ml-auto relative flex h-2 w-2 flex-shrink-0">
            <span aria-hidden="true" className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span aria-hidden="true" className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        )}

        {/* Status dot no expandido (Configurações: ML desconectado) */}
        {isExpanded && showStatusDot && !showLiveDot && (
          <span role="status" aria-label="Conta Magalu não conectada" className="ml-auto w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        )}
      </NavLink>
    </SidebarTooltip>
  )
}
