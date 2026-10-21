import { cn } from '../../lib/utils'
import {
  PauseCircle, AlertTriangle, Link2Off, PackageX, CheckCircle2, Activity,
} from 'lucide-react'

const STATUS_CONFIG = {
  paused: { label: 'Pausado', icon: PauseCircle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low_conversion: { label: 'Baixa conversão', icon: Activity, cls: 'bg-red-50 text-red-700 border-red-200' },
  out_of_catalog: { label: 'Fora do catálogo', icon: Link2Off, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  low_stock: { label: 'Estoque baixo', icon: PackageX, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  warning: { label: 'Atenção', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  good: { label: 'OK', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function StatusPill({ status, label, className }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.warning
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
        cfg.cls,
        className,
      )}
    >
      <Icon aria-hidden="true" size={11} strokeWidth={2.2} />
      {label ?? cfg.label}
    </span>
  )
}
