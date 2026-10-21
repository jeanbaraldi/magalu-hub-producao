import { cn } from '../../../lib/utils'

/**
 * Cabeçalho de grupo da navegação.
 * Expandido: label uppercase + linha sutil à direita.
 * Recolhido: separador <hr/> (label sr-only).
 *
 * @param {{
 *   label: string,
 *   isExpanded: boolean,
 *   isFirst?: boolean,
 *   children: React.ReactNode,
 * }} props
 */
export default function SidebarGroup({ label, isExpanded, isFirst, children }) {
  return (
    <div className={cn(isFirst ? '' : isExpanded ? 'pt-3' : 'pt-2')}>
      {isExpanded ? (
        <div className="flex items-center gap-2 px-3 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            {label}
          </span>
          <span aria-hidden="true" className="flex-1 h-px bg-white/8" />
        </div>
      ) : (
        <>
          <span className="sr-only">{label}</span>
          {!isFirst && <hr className="mx-3 border-white/8 mb-1" />}
        </>
      )}
      <div className={cn(isExpanded ? 'space-y-1' : 'space-y-0.5')}>{children}</div>
    </div>
  )
}
