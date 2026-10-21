import { clsx } from 'clsx'

export function cn(...args) {
  return clsx(args)
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formato curto BRL: sem centavos, com separador de milhar.
 * Útil para eixos de gráficos onde "R$ 1.234,56" polui visualmente.
 * @example
 * formatCurrencyShort(1234)   // "R$ 1.234"
 * formatCurrencyShort(50000)  // "R$ 50.000"
 */
export function formatCurrencyShort(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

export function formatPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function getProfitColor(value) {
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-red-600'
  return 'text-slate-500'
}

export function getProfitBg(value) {
  if (value > 0) return 'bg-emerald-50 text-emerald-700'
  if (value < 0) return 'bg-red-50 text-red-700'
  return 'bg-slate-50 text-slate-700'
}

export function getMarginRating(margin) {
  if (margin >= 0.3) return { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-100' }
  if (margin >= 0.2) return { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-100' }
  if (margin >= 0.1) return { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  if (margin >= 0) return { label: 'Baixo', color: 'text-orange-600', bg: 'bg-orange-100' }
  return { label: 'Prejuízo', color: 'text-red-600', bg: 'bg-red-100' }
}

export function getRoasRating(roas) {
  if (roas >= 10) return { label: 'Excelente', color: 'text-emerald-600' }
  if (roas >= 6) return { label: 'Bom', color: 'text-blue-600' }
  if (roas >= 3) return { label: 'Regular', color: 'text-yellow-600' }
  if (roas >= 1) return { label: 'Baixo', color: 'text-orange-600' }
  return { label: 'Crítico', color: 'text-red-600' }
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  return diff
}

export function isPromotionActive(ad) {
  if (!ad.isPromotionActive) return false
  const now = new Date()
  const start = ad.promotionStart ? new Date(ad.promotionStart) : null
  const end = ad.promotionEnd ? new Date(ad.promotionEnd) : null
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 30) return `${diffD}d`
  if (diffD < 365) return `${Math.floor(diffD / 30)}m`
  return `${Math.floor(diffD / 365)}a`
}
