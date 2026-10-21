import { cn } from '../../lib/utils'
import { Star, Tag, CheckCircle, Clock, PauseCircle, XCircle } from 'lucide-react'

export function ListingBadge({ type }) {
  const config = {
    gold_premium: { label: 'Gold Premium', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    gold_special: { label: 'Gold Special', className: 'bg-orange-50 text-orange-800 border-orange-200' },
    gold: { label: 'Gold', className: 'bg-amber-50 text-amber-800 border-amber-200' },
    silver: { label: 'Silver', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  }
  const c = config[type] || config.silver
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border', c.className)}>
      <Star size={10} fill="currentColor" strokeWidth={0} />
      {c.label}
    </span>
  )
}

export function CatalogBadge({ isCatalog }) {
  if (!isCatalog) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <CheckCircle size={10} strokeWidth={2.5} />
      Catálogo
    </span>
  )
}

export function PromoBadge({ isActive }) {
  if (!isActive) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
      <Tag size={10} strokeWidth={2.5} />
      Em Promoção
    </span>
  )
}

export function StatusBadge({ status }) {
  const config = {
    active: { label: 'Ativo', icon: CheckCircle, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    paused: { label: 'Pausado', icon: PauseCircle, className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    closed: { label: 'Encerrado', icon: XCircle, className: 'bg-slate-100 text-slate-500 border-slate-200' },
  }
  const c = config[status] || config.closed
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border', c.className)}>
      <Icon size={10} strokeWidth={2.5} />
      {c.label}
    </span>
  )
}

export function ShippingBadge({ mode }) {
  const config = {
    full: { label: 'Envios Full', className: 'bg-green-50 text-green-700 border-green-200' },
    me2: { label: 'ME2', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  }
  const c = config[mode] || config.me2
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border', c.className)}>
      {c.label}
    </span>
  )
}

export function ProfitBadge({ value }) {
  const isProfit = value > 0
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border',
      isProfit
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
    )}>
      {isProfit ? '▲ Lucrativo' : '▼ Prejuízo'}
    </span>
  )
}
