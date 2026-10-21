import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'

function Dica({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-600">{`Receita: ${brl(d.receita)}`}</p>
      <p className="text-slate-600">{`Pedidos: ${d.pedidos}`}</p>
    </div>
  )
}

export default function ReceitaDiariaChart({ serie }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Receita por dia</h2>
      <p className="text-xs text-slate-400 mb-4">Só vendas (cancelados fora), dias de Brasília</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis yAxisId="r" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
            <Tooltip content={<Dica />} />
            <Bar yAxisId="r" dataKey="receita" fill="#0086FF" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line yAxisId="p" dataKey="pedidos" stroke="#0f172a" strokeWidth={1.5} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
