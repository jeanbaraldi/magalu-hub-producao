import { DollarSign, Package, PiggyBank, Percent } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { brl, inteiro } from '../magalu/formatos'
import { pct, corMargem } from './percentual'

export default function PerformanceKpis({ kpis, podeVerValores, loading }) {
  const v = (x) => (loading ? '…' : x)
  const foraMc = kpis.skusSemMc > 0 ? `${kpis.skusSemMc} de ${kpis.skus} SKU(s) sem MC ficaram de fora` : undefined
  const subReceita = [
    kpis.itensSemValor > 0 && `${kpis.itensSemValor} item(ns) sem valor legível fora da soma`,
    kpis.semSku > 0 && `${kpis.semSku} item(ns) sem SKU`,
  ].filter(Boolean).join(' · ') || undefined
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard size="sm" title="Receita" value={v(brl(kpis.receita))} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle={subReceita} />
      <MetricCard size="sm" title="Unidades" value={v(inteiro(kpis.skus > 0 ? kpis.unidades : null))} icon={Package} subtitle={kpis.skus > 0 ? `${kpis.skus} SKU(s) vendidos` : undefined} />
      <MetricCard
        size="sm" title="MC total" icon={PiggyBank} iconColor="text-violet-600" iconBg="bg-violet-50"
        value={v(podeVerValores ? brl(kpis.mcTotal) : '—')}
        subtitle={podeVerValores ? foraMc : 'Seu acesso não inclui margem'}
      />
      <MetricCard
        size="sm" title="Margem média" icon={Percent} iconColor="text-amber-600" iconBg="bg-amber-50"
        value={v(podeVerValores ? pct(kpis.margemMedia) : '—')} valueColor={podeVerValores ? corMargem(kpis.margemMedia) : undefined}
        subtitle={podeVerValores ? 'Ponderada pela receita dos SKUs com MC' : undefined}
      />
    </div>
  )
}
