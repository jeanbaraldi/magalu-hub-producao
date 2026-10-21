import { cn } from '../../lib/utils'

/**
 * Toggle group para seletor de período (7d/15d/30d/Personalizado).
 * @param {object} props
 * @param {string|number} props.value
 * @param {{value, label}[]} props.options
 * @param {(v) => void} props.onChange
 * @param {string} [props.ariaLabel]
 */
export default function PeriodToggle({ value, options, onChange, ariaLabel = 'Selecionar período', className }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center bg-slate-100 rounded-xl p-0.5', className)}
    >
      {options.map((opt) => {
        const active = String(opt.value) === String(value)
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue',
              active
                ? 'bg-mg-blue text-white shadow-soft'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
