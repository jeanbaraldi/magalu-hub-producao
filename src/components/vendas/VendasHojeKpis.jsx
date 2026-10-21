import KpiComparado from '../relatorios/KpiComparado'
import { brl, inteiro } from '../magalu/formatos'

/** KPIs de hoje × ontem até a mesma hora. Só props. */
export default function VendasHojeKpis({ kpis, loading }) {
  const o = kpis.ontem
  const leg = 'ontem até esta hora'
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiComparado
        titulo="Receita hoje" valor={brl(kpis.receita)} comparado={brl(o.receita)} variacao={kpis.variacao.receita} legenda={leg} loading={loading}
        aviso={kpis.semValor > 0 ? `${kpis.semValor} pedido(s) sem valor legível ficaram fora da soma` : undefined}
      />
      <KpiComparado titulo="Pedidos (vendas)" valor={inteiro(kpis.pedidos)} comparado={inteiro(o.pedidos)} variacao={kpis.variacao.pedidos} legenda={leg} loading={loading}
        aviso={kpis.cancelados > 0 ? `${kpis.cancelados} cancelado(s) hoje, fora da conta` : undefined}
      />
      <KpiComparado
        titulo="Unidades" valor={inteiro(kpis.unidades)} comparado={inteiro(o.unidades)} variacao={kpis.variacao.unidades} legenda={leg} loading={loading}
        aviso={kpis.semQtd > 0 ? `${kpis.semQtd} item(ns) sem quantidade legível ficaram de fora` : undefined}
      />
      <KpiComparado titulo="Ticket médio" valor={brl(kpis.ticket)} comparado={brl(o.ticket)} variacao={kpis.variacao.ticket} legenda={leg} loading={loading} />
    </div>
  )
}
