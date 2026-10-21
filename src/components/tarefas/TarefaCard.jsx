import { AlertTriangle, Calendar, User } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import { areaInfo, prioridadeInfo } from '../../features/tarefas/tarefas.constants'
import { cn } from '../../lib/utils'

export const prazoTexto = (d) => (d ? d.split('-').reverse().join('/') : null)

/** Card do quadro. Clicar ou Enter abre o detalhe. Atraso vence a cor da área. */
export default function TarefaCard({ tarefa, onAbrir }) {
  const area = areaInfo(tarefa.area)
  const prio = prioridadeInfo(tarefa.priority)
  return (
    <button
      type="button"
      onClick={() => onAbrir(tarefa)}
      className={cn(
        'w-full text-left bg-white rounded-xl border border-slate-200 border-l-4 p-3 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue',
        tarefa.atrasada ? 'border-l-rose-600 ring-1 ring-rose-200' : area.borda,
      )}
    >
      <p className={cn('text-sm font-semibold text-slate-800 line-clamp-2', tarefa.status === 'concluida' && 'line-through text-slate-400')}>{tarefa.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold', area.chip)}>{area.label}</span>
        <StatusBadge label={prio.label} tone={prio.tone} />
        {tarefa.atrasada && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700"><AlertTriangle aria-hidden="true" size={11} /> Atrasada</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className={cn('inline-flex items-center gap-1', !tarefa.assignee && 'text-amber-700 font-semibold')}>
          <User aria-hidden="true" size={11} /> {tarefa.assignee ?? 'Sem responsável'}
        </span>
        {tarefa.due_date && <span className="inline-flex items-center gap-1"><Calendar aria-hidden="true" size={11} /> {prazoTexto(tarefa.due_date)}</span>}
        {tarefa.sku && <span className="font-mono">{tarefa.sku}</span>}
      </div>
    </button>
  )
}
