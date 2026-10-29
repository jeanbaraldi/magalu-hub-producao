// Cards de resumo do topo, clicáveis (funcionam como filtro). Igual ao Gestor ML.
import { AlertOctagon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { FAMILIA_CONFIG, FAMILIA_ORDER } from '../../../features/catalogo/diagnostico.constants'

export default function DiagnosticoSummaryCards({ summary, activeFamilia, criticosActive, onToggleFamilia, onToggleCriticos }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {FAMILIA_ORDER.map((fam) => {
        const cfg = FAMILIA_CONFIG[fam]
        const active = activeFamilia === fam
        return (
          <button key={fam} type="button" onClick={() => onToggleFamilia(fam)} aria-pressed={active}
            className={cn(
              'text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue',
              active ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200',
            )}>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cfg.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.porFamilia[fam]}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{cfg.hint}</p>
          </button>
        )
      })}
      <button type="button" onClick={onToggleCriticos} aria-pressed={criticosActive}
        className={cn(
          'text-left rounded-2xl border p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue',
          criticosActive ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-red-200',
        )}>
        <div className="flex items-center gap-2">
          <AlertOctagon size={13} className={criticosActive ? 'text-white' : 'text-red-600'} />
          <span className={cn('text-xs font-semibold uppercase tracking-wide', criticosActive ? 'text-red-100' : 'text-red-600')}>Críticos</span>
        </div>
        <p className={cn('text-2xl font-black mt-1', criticosActive ? 'text-white' : 'text-red-600')}>{summary.criticos}</p>
        <p className={cn('text-[11px] mt-0.5', criticosActive ? 'text-red-100' : 'text-slate-400')}>Severidade máxima</p>
      </button>
    </div>
  )
}
