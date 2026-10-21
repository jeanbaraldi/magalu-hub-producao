import { AlertTriangle } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import { areaInfo, prioridadeInfo, statusInfo } from '../../features/tarefas/tarefas.constants'
import { prazoTexto } from './TarefaCard'
import { cn } from '../../lib/utils'

/** Mesmas regras do quadro: cor por área, atraso vence a área, clique abre o detalhe. */
export default function TarefasLista({ rows, onAbrir }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 text-center">Nenhuma tarefa.</p>
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Tarefa</th>
            <th className="text-left px-4 py-3 font-semibold">Área</th>
            <th className="text-left px-4 py-3 font-semibold">Prioridade</th>
            <th className="text-left px-4 py-3 font-semibold">Situação</th>
            <th className="text-left px-4 py-3 font-semibold">Responsável</th>
            <th className="text-left px-4 py-3 font-semibold">Prazo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((t) => {
            const area = areaInfo(t.area)
            const prio = prioridadeInfo(t.priority)
            return (
              <tr
                key={t.id}
                tabIndex={0}
                onClick={() => onAbrir(t)}
                onKeyDown={(e) => { if (e.key === 'Enter') onAbrir(t) }}
                className={cn('cursor-pointer hover:bg-slate-50 border-l-4 focus-visible:outline-none focus-visible:bg-slate-50', t.atrasada ? 'border-l-rose-600' : area.borda)}
              >
                <td className="px-4 py-3">
                  <p className={cn('font-medium text-slate-800', t.status === 'concluida' && 'line-through text-slate-400')}>{t.title}</p>
                  {t.sku && <p className="text-xs text-slate-400 font-mono">{t.sku}</p>}
                </td>
                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold', area.chip)}>{area.label}</span></td>
                <td className="px-4 py-3"><StatusBadge label={prio.label} tone={prio.tone} /></td>
                <td className="px-4 py-3 text-slate-700">{statusInfo(t.status).label}</td>
                <td className={cn('px-4 py-3', !t.assignee && 'text-amber-700 font-semibold')}>{t.assignee ?? 'Sem responsável'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {prazoTexto(t.due_date) ?? '—'}
                  {t.atrasada && <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700"><AlertTriangle aria-hidden="true" size={11} /> atrasada</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
