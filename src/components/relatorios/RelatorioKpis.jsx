import KpiComparado from './KpiComparado'
import { brl, inteiro } from '../magalu/formatos'

/** KPIs do período atual × anterior. Cancelados subindo é ruim (cor invertida). Só props. */
export default function RelatorioKpis({ kpis, loading }) {
  const { atual: a, anterior: b, variacao: v } = kpis
  const leg = 'anterior'
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <KpiComparado titulo="Receita" valor={brl(a.receita)} comparado={brl(b.receita)} variacao={v.receita} legenda={leg} loading={loading}
        aviso={a.semValor + b.semValor > 0 ? `${a.semValor} pedido(s) atuais e ${b.semValor} anteriores sem valor legível, fora da soma` : undefined}
      />
      <KpiComparado titulo="Pedidos (vendas)" valor={inteiro(a.pedidos)} comparado={inteiro(b.pedidos)} variacao={v.pedidos} legenda={leg} loading={loading} />
      <KpiComparado titulo="Unidades" valor={inteiro(a.unidades)} comparado={inteiro(b.unidades)} variacao={v.unidades} legenda={leg} loading={loading}
        aviso={a.semQtd + b.semQtd > 0 ? `${a.semQtd + b.semQtd} item(ns) sem quantidade legível ficaram de fora` : undefined}
      />
      <KpiComparado titulo="Ticket médio" valor={brl(a.ticket)} comparado={brl(b.ticket)} variacao={v.ticket} legenda={leg} loading={loading} />
      <KpiComparado titulo="Cancelados" valor={inteiro(a.cancelados)} comparado={inteiro(b.cancelados)} variacao={v.cancelados} piorQuandoSobe legenda={leg} loading={loading}
        aviso="Cancelados subir é ruim (vermelho)"
      />
    </div>
  )
}
