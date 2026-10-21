import { PiggyBank, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { brl, inteiro } from '../magalu/formatos'

export default function LucroKpis({ kpis, loading }) {
  const v = (x) => (loading ? '…' : x)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard size="sm" title="Lucro conhecido (MC)" value={v(brl(kpis.lucroTotal))} icon={PiggyBank} iconColor="text-violet-600" iconBg="bg-violet-50"
        subtitle={kpis.pendentes > 0 ? `Não inclui ${kpis.pendentes} SKU(s) pendente(s)` : undefined} />
      <MetricCard size="sm" title="SKUs lucrativos" value={v(inteiro(kpis.skus > 0 ? kpis.lucrativos : null))} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      <MetricCard size="sm" title="SKUs com prejuízo" value={v(inteiro(kpis.skus > 0 ? kpis.negativos : null))} icon={TrendingDown} iconColor="text-rose-600" iconBg="bg-rose-50"
        valueColor={kpis.negativos > 0 ? 'text-rose-600' : undefined} subtitle={kpis.prejuizo != null ? `Somam ${brl(kpis.prejuizo)}` : undefined} />
      <MetricCard size="sm" title="Pendentes" value={v(inteiro(kpis.skus > 0 ? kpis.pendentes : null))} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50"
        subtitle={kpis.pendentes > 0 ? `${brl(kpis.receitaPendente)} de receita sem lucro apurado` : undefined} />
    </div>
  )
}
