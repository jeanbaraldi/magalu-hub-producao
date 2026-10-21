import { cn } from '../../lib/utils'

const CORES = {
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
}

export default function AlertasResumo({ grupos, loading }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {grupos.map((g) => (
        <div key={g.value} className={cn('rounded-2xl border p-4', CORES[g.tone])}>
          <p className="text-xs font-semibold uppercase tracking-wide">{g.label}</p>
          <p className="text-2xl font-bold mt-1">{loading ? '…' : g.itens.length}</p>
          <p className="text-xs opacity-80 mt-0.5">{g.descricao}</p>
        </div>
      ))}
    </div>
  )
}
