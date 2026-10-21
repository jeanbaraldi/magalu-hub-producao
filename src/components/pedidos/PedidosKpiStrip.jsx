import { ReceiptText, DollarSign, Ticket, XCircle } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { brl, inteiro } from '../magalu/formatos'

export default function PedidosKpiStrip({ kpis, loading }) {
  const v = (x) => (loading ? '…' : x)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard size="sm" title="Pedidos (vendas)" value={v(inteiro(kpis.pedidos))} icon={ReceiptText} />
      <MetricCard
        size="sm" title="Receita" value={v(brl(kpis.receita))} icon={DollarSign}
        iconColor="text-emerald-600" iconBg="bg-emerald-50"
        subtitle={kpis.semValor > 0 ? `${kpis.semValor} pedido(s) sem valor legível ficaram de fora` : undefined}
      />
      <MetricCard size="sm" title="Ticket médio" value={v(brl(kpis.ticket))} icon={Ticket} iconColor="text-violet-600" iconBg="bg-violet-50" />
      <MetricCard size="sm" title="Cancelados" value={v(inteiro(kpis.cancelados))} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
    </div>
  )
}
