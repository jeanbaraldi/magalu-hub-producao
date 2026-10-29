// Totais do Catálogo no desenho do Gestor ML (MetricCard). Componente burro.
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { formatCurrency, formatNumber } from '../../lib/utils'

export default function CatalogoKpis({ totais, podeVerValores }) {
  const c = totais.contribuicao
  const ok = c == null || c >= 0
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard title="Receita Total" value={formatCurrency(totais.receita)} icon={DollarSign}
        iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle="Últimos 30 dias" />
      <MetricCard title="Contribuição Total"
        value={!podeVerValores ? '—' : c == null ? 'Pendente' : formatCurrency(c)}
        icon={TrendingUp} iconColor={ok ? 'text-emerald-600' : 'text-red-600'} iconBg={ok ? 'bg-emerald-50' : 'bg-red-50'}
        valueColor={ok ? 'text-emerald-600' : 'text-red-600'}
        subtitle={!podeVerValores ? 'Seu acesso não inclui custos' : 'Após custo, comissão, frete e impostos'} />
      <MetricCard title="Unidades Vendidas" value={formatNumber(totais.unidades)} icon={ShoppingCart}
        iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Últimos 30 dias" />
    </div>
  )
}
