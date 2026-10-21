import { cn } from '../../lib/utils'

const colorClasses = {
  yellow: 'bg-mg-blue',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  info: 'bg-status-info',
  purple: 'bg-status-purple',
  slate: 'bg-slate-400',
}

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'yellow',
  size = 'md',
  showPercent = false,
  label,
  className,
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
          {showPercent && <span className="text-xs font-bold text-slate-700 tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progresso'}
        className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightClass)}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', colorClasses[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
