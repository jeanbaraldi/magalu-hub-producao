import { ListTodo, AlertTriangle, CheckCircle2, UserX } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { inteiro } from '../magalu/formatos'

export default function TarefasKpis({ kpis, loading }) {
  const v = (x) => (loading ? '…' : inteiro(x))
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard size="sm" title="Abertas" value={v(kpis.abertas)} icon={ListTodo} />
      <MetricCard size="sm" title="Atrasadas" value={v(kpis.atrasadas)} icon={AlertTriangle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      <MetricCard size="sm" title="Concluídas (7 dias)" value={v(kpis.concluidasSemana)} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      <MetricCard size="sm" title="Abertas sem responsável" value={v(kpis.semResponsavel)} icon={UserX} iconColor="text-amber-600" iconBg="bg-amber-50" />
    </div>
  )
}
