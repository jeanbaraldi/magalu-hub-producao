import { AREAS, TODOS, SEM_RESPONSAVEL } from '../../features/tarefas/tarefas.constants'

const selectCls = 'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue'

export default function TarefasFiltros({ area, onArea, responsavel, onResponsavel, pessoas }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Área
        <select className={selectCls} value={area} onChange={(e) => onArea(e.target.value)}>
          <option value={TODOS}>Todas</option>
          {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Responsável
        <select className={selectCls} value={responsavel} onChange={(e) => onResponsavel(e.target.value)}>
          <option value={TODOS}>Todos</option>
          <option value={SEM_RESPONSAVEL}>Sem responsável</option>
          {pessoas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
    </div>
  )
}
