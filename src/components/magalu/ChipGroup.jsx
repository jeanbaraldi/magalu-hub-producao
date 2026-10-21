import { cn } from '../../lib/utils'

/** Grupo de chips de escolha única (período, status). */
export default function ChipGroup({ options, value, onChange, ariaLabel }) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
