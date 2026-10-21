import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { CURVA_CORES } from '../../features/analiseAbc/analiseAbc.constants'
import { pct } from '../performance/percentual'
import { fmtMetrica } from './fmt'

function Dica({ active, payload, metrica }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[240px]">
      <p className="font-semibold text-slate-700 truncate">{d.rotulo}</p>
      <p className="text-slate-400 font-mono">{d.sku}</p>
      <p className="text-slate-600 mt-1">{`${metrica === 'unidades' ? 'Unidades' : 'Receita'}: ${fmtMetrica(d.valor, metrica)}`}</p>
      <p className="text-slate-600">{`Acumulado: ${pct(d.acumulado)} · Curva ${d.curva}`}</p>
    </div>
  )
}

/** Pareto: barras por SKU (cor da curva) + linha do acumulado. Eixo por posição. */
export default function ParetoChart({ pareto, metrica }) {
  const dados = pareto.map((p, i) => ({ ...p, pos: i + 1 }))
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Pareto</h2>
      <p className="text-xs text-slate-400 mb-4">SKUs em ordem de {metrica === 'unidades' ? 'unidades' : 'receita'}; a linha é o acumulado (cortes em 80% e 95%)</p>
      {dados.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">Sem vendas no período</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="pos" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={12} />
              <YAxis yAxisId="v" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={72} tickFormatter={metrica === 'unidades' ? undefined : formatCurrencyShort} />
              <YAxis yAxisId="a" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<Dica metrica={metrica} />} />
              <ReferenceLine yAxisId="a" y={80} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine yAxisId="a" y={95} stroke="#0086FF" strokeDasharray="4 4" />
              <Bar yAxisId="v" dataKey="valor" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {dados.map((d) => <Cell key={d.sku} fill={CURVA_CORES[d.curva]} />)}
              </Bar>
              <Line yAxisId="a" dataKey="acumulado" stroke="#0f172a" strokeWidth={1.5} dot={false} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
