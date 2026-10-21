import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-500',
  iconBg = 'bg-blue-50',
  trend,        // número: positivo = up, negativo = down, null = neutro
  trendLabel,
  valueColor,
  highlight,    // boolean - destaque azul Magalu
  size = 'md',  // 'sm' | 'md'
}) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-400'
  const trendBg = trend > 0 ? 'bg-emerald-50' : trend < 0 ? 'bg-red-50' : 'bg-slate-100'

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        highlight && 'border-mg-blue ring-1 ring-mg-blue/40',
        size === 'sm' ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-slate-500 font-medium truncate',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {title}
          </p>
          <p className={cn(
            'font-bold mt-1 leading-none tabular-nums',
            valueColor || 'text-slate-900',
            size === 'sm' ? 'text-xl' : 'text-2xl'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-xl flex-shrink-0 flex items-center justify-center', iconBg, size === 'sm' ? 'w-9 h-9' : 'w-11 h-11')}>
            <Icon size={size === 'sm' ? 16 : 20} className={iconColor} strokeWidth={1.8} />
          </div>
        )}
      </div>

      {(trend !== undefined && trend !== null) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <span className={cn('flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md', trendBg, trendColor)}>
            <TrendIcon size={11} strokeWidth={2.5} />
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
