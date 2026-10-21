import { cn } from '../../../lib/utils'

/**
 * Wrapper que mostra um tooltip à direita do `children` em :hover/:focus-within.
 * Ativo apenas quando `enabled === true`. CSS puro — zero dep nova.
 *
 * @param {{
 *   label: string,
 *   enabled?: boolean,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function SidebarTooltip({ label, enabled = true, children, className }) {
  if (!enabled) return <>{children}</>

  return (
    <span className={cn('relative flex group', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50',
          'whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-elevated border border-slate-700',
          'opacity-0 translate-x-[-4px] transition-all duration-150',
          'group-hover:opacity-100 group-hover:translate-x-0',
          'group-focus-within:opacity-100 group-focus-within:translate-x-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
