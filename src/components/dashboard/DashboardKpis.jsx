import { DollarSign, ReceiptText, Ticket, XCircle, Zap, Tag, PackageX } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import { brl, inteiro } from '../magalu/formatos'

export default function DashboardKpis({ kpis, dias, loading }) {
  const v = (x) => (loading ? '…' : x)
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-mg-blue to-mg-blue-dark rounded-xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Zap aria-hidden="true" size={18} />
          </div>
          <div>
            <p className="text-xs text-white/80 font-medium">Vendas de hoje</p>
            <p className="text-2xl font-bold tabular-nums">{v(brl(kpis.hojeReceita))}</p>
          </div>
        </div>
        <p className="text-sm text-white/90">{v(`${inteiro(kpis.hojePedidos)} pedido(s) hoje`)}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          size="sm" title={`Receita (${dias} dias)`} value={v(brl(kpis.receita))} icon={DollarSign}
          iconColor="text-emerald-600" iconBg="bg-emerald-50"
          subtitle={kpis.semValor > 0 ? `${kpis.semValor} pedido(s) sem valor legível fora da soma` : undefined}
        />
        <MetricCard size="sm" title="Pedidos" value={v(inteiro(kpis.pedidos))} icon={ReceiptText} />
        <MetricCard size="sm" title="Ticket médio" value={v(brl(kpis.ticket))} icon={Ticket} iconColor="text-violet-600" iconBg="bg-violet-50" />
        <MetricCard size="sm" title="Cancelados" value={v(inteiro(kpis.cancelados))} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
        <MetricCard size="sm" title="SKUs ativos" value={v(`${inteiro(kpis.skusAtivos)} de ${inteiro(kpis.skusTotal)}`)} icon={Tag} iconColor="text-sky-600" iconBg="bg-sky-50" />
        <MetricCard size="sm" title="SKUs sem estoque" value={v(inteiro(kpis.skusSemEstoque))} icon={PackageX} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>
    </div>
  )
}
