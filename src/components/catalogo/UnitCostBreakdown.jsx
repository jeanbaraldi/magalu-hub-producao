import { formatCurrency } from '../../lib/utils'

// Parcelas da margem por unidade (saída de `margemUnitaria`), no desenho do Gestor ML.
// Componente burro: parcela desconhecida aparece como "—" com o motivo, nunca como R$ 0.
export default function UnitCostBreakdown({ unit, compact = false }) {
  if (!unit) return null
  const p = unit.parts ?? {}
  const pct = p.comissaoPct != null ? ` (${p.comissaoPct.toFixed(1).replace('.', ',')}%${p.fonteComissao === 'percentual' ? ', configurada' : ''})` : ''
  const rows = [
    { id: 'comissao', label: `Comissão Magalu${pct}`, value: p.comissao, why: 'sem venda em 30 dias e sem comissão configurada em Impostos' },
    { id: 'frete', label: 'Frete (% configurado)', value: p.frete, why: 'frete não configurado em Impostos' },
    { id: 'custo', label: 'Custo do produto', value: p.custo, why: 'sem custo cadastrado' },
    { id: 'impostos', label: 'Impostos', value: p.impostos, why: 'alíquota não configurada' },
  ]
  const text = compact ? 'text-[11px]' : 'text-sm'
  return (
    <ul className={`space-y-0.5 ${text}`}>
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2">
          <span className="text-slate-500 truncate">{r.label}</span>
          {r.value != null ? (
            <span className="font-semibold text-rose-600 tabular-nums flex-shrink-0">- {formatCurrency(r.value)}</span>
          ) : (
            <span className="text-slate-300 flex-shrink-0" title={r.why}>—</span>
          )}
        </li>
      ))}
    </ul>
  )
}
