import { Target, Activity, TrendingUp, Gauge } from 'lucide-react'
import MetricCard from '../ui/MetricCard'
import VariacaoBadge from '../relatorios/VariacaoBadge'

const un = (v) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v))
const un1 = (v) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v))
const pct = (v) => (v == null || !Number.isFinite(v) ? '—' : `${v.toFixed(1).replace('.', ',')}%`)

/** KPIs da previsão (unidades). Só props. */
export default function PrevisaoKpis({ kpis, horizonte, loading }) {
  const v = (x) => (loading ? '…' : x)
  const p = kpis.projecao
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        size="sm" highlight title={`Unidades projetadas (${horizonte} dias)`} value={v(un(p?.provavel))} icon={Target}
        subtitle={p ? `Faixa: ${un(p.conservador)} a ${un(p.agressivo)}` : 'Sem base para projetar'}
      />
      <MetricCard size="sm" title="Média diária (90 dias)" value={v(un1(kpis.mediaDiaria))} icon={Activity} iconColor="text-sky-600" iconBg="bg-sky-50" subtitle="Unidades por dia, dias sem venda contam como zero" />
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tendência (7d × 7d anteriores)</p>
            <div className="mt-2">{loading ? '…' : <VariacaoBadge valor={kpis.tendencia} />}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center"><TrendingUp size={16} className="text-violet-600" /></div>
        </div>
      </div>
      <MetricCard
        size="sm" title="Acurácia (MAPE, backtest 14d)" value={v(pct(kpis.acuracia?.mape))} icon={Gauge} iconColor="text-amber-600" iconBg="bg-amber-50"
        subtitle={kpis.acuracia
          ? `Erro médio por dia em ${kpis.acuracia.diasAvaliados} dia(s) com venda; viés ${pct(kpis.acuracia.vies)}`
          : 'Sem base suficiente para medir'}
      />
    </div>
  )
}
