import { formatCurrency } from '../../lib/utils'

/** Valor ausente vira "—", nunca R$ 0,00. */
export const brl = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : formatCurrency(Number(v)))
export const inteiro = (v) => (v == null ? '—' : new Intl.NumberFormat('pt-BR').format(v))
export const dataHora = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
