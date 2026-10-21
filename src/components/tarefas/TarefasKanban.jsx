import { STATUS } from '../../features/tarefas/tarefas.constants'
import TarefaCard from './TarefaCard'

export default function TarefasKanban({ grupos, onAbrir }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STATUS.map((s) => {
        const lista = grupos[s.value] ?? []
        return (
          <section key={s.value} aria-label={s.label} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 min-h-[160px]">
            <h2 className="flex items-center justify-between text-sm font-bold text-slate-700 mb-3 px-1">
              {s.label}<span className="text-xs font-semibold text-slate-400">{lista.length}</span>
            </h2>
            <div className="space-y-2">
              {lista.length === 0
                ? <p className="text-xs text-slate-400 px-1">Nenhuma tarefa.</p>
                : lista.map((t) => <TarefaCard key={t.id} tarefa={t} onAbrir={onAbrir} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
