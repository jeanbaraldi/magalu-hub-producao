import { Tag, CheckCircle2, PackageX, Boxes } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { inteiro } from '../magalu/formatos'

export default function AnunciosResumo({ resumo, loading }) {
  const v = (x) => (loading ? '…' : x)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard size="sm" title="SKUs" value={v(inteiro(resumo.total))} icon={Tag} />
      <MetricCard size="sm" title="Ativos" value={v(inteiro(resumo.ativos))} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      <MetricCard size="sm" title="Sem estoque" value={v(inteiro(resumo.semEstoque))} icon={PackageX} iconColor="text-rose-600" iconBg="bg-rose-50" />
      <MetricCard
        size="sm" title="Estoque total" value={v(inteiro(resumo.estoqueTotal))} icon={Boxes} iconColor="text-violet-600" iconBg="bg-violet-50"
        subtitle={resumo.estoqueDesconhecido > 0 ? `${resumo.estoqueDesconhecido} SKU(s) sem estoque informado` : undefined}
      />
    </div>
  )
}
