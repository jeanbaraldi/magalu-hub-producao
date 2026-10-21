import { cn } from '../../lib/utils'

const TONES = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
}

export default function StatusBadge({ label, tone = 'slate' }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap', TONES[tone] ?? TONES.slate)}>
      {label}
    </span>
  )
}
