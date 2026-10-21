// src/components/layout/Sidebar/SidebarBadge.jsx
import { cn } from '../../../lib/utils'

const TONE_CLASS = {
  default: 'bg-slate-700 text-white',
  warning: 'bg-amber-500 text-white',
  danger:  'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
}

const DOT_TONE_CLASS = {
  default: 'bg-slate-400',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  success: 'bg-emerald-500',
}

/**
 * Badge da sidebar — pílula com número (expandido) ou dot (recolhido).
 * "99+" se value > 99.
 *
 * @param {{
 *   value: number | string,
 *   tone?: import('./sidebar.types').SidebarBadgeTone,
 *   isExpanded: boolean,
 *   ariaLabel?: string,
 * }} props
 */
export default function SidebarBadge({ value, tone = 'default', isExpanded, ariaLabel }) {
  const num = typeof value === 'number' ? value : Number(value)
  const display = Number.isFinite(num) && num > 99 ? '99+' : String(value)

  if (isExpanded) {
    return (
      <span
        aria-label={ariaLabel}
        className={cn(
          'ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
          'transition-opacity duration-150',
          TONE_CLASS[tone],
        )}
      >
        {display}
      </span>
    )
  }

  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        'absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-sidebar-bg',
        DOT_TONE_CLASS[tone],
      )}
    />
  )
}
