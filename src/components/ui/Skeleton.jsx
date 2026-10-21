import { cn } from '../../lib/utils'

export default function Skeleton({ className, variant = 'text', label = 'Carregando…' }) {
  const variants = {
    text: 'h-4 rounded',
    card: 'h-32 rounded-xl',
    circle: 'w-10 h-10 rounded-full',
    metric: 'h-24 rounded-xl',
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('animate-pulse bg-slate-200', variants[variant], className)}
    />
  )
}

export function SkeletonMetricCard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando métricas…"
      className="bg-white rounded-xl border border-slate-200 p-5"
    >
      <div className="animate-pulse space-y-3" aria-hidden="true">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-7 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
    </div>
  )
}

export function SkeletonListingCard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando anúncio…"
      className="bg-white rounded-xl border border-slate-200 p-4"
    >
      <div className="animate-pulse flex gap-3" aria-hidden="true">
        <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded" />
          <div className="flex gap-1.5 mt-2">
            <div className="h-5 w-14 bg-slate-100 rounded-md" />
            <div className="h-5 w-16 bg-slate-100 rounded-md" />
            <div className="h-5 w-12 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, variant = 'metric', className }) {
  return (
    <div className={cn('grid gap-4', className)} role="status" aria-busy="true" aria-label="Carregando…">
      {Array.from({ length: count }).map((_, i) => (
        variant === 'listing' ? (
          <SkeletonListingCard key={i} />
        ) : (
          <SkeletonMetricCard key={i} />
        )
      ))}
    </div>
  )
}
