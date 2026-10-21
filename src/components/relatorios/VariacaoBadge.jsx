import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Selo de variação %. `piorQuandoSobe` inverte a cor (ex.: cancelados).
 * Variação nula (sem base de comparação) aparece como "—", nunca 0%.
 */
export default function VariacaoBadge({ valor, piorQuandoSobe = false, legenda }) {
  if (valor == null || !Number.isFinite(valor)) {
    return <span className="text-xs text-slate-400">{legenda ? `— ${legenda}` : 'sem base de comparação'}</span>
  }
  const neutro = Math.abs(valor) < 0.05
  const bom = neutro ? null : (valor > 0) !== piorQuandoSobe
  const Icone = neutro ? Minus : valor > 0 ? TrendingUp : TrendingDown
  const cor = bom == null ? 'bg-slate-100 text-slate-500' : bom ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums', cor)}>
        <Icone aria-hidden="true" size={11} strokeWidth={2.5} />
        {`${valor > 0 ? '+' : ''}${valor.toFixed(1).replace('.', ',')}%`}
      </span>
      {legenda && <span className="text-xs text-slate-400">{legenda}</span>}
    </span>
  )
}
