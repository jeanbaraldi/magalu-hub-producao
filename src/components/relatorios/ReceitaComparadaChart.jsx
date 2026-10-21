import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-700"><span className="font-semibold">{d.rotulo}</span>{`: ${brl(d.atual)}`}</p>
      <p className="text-slate-500"><span className="font-semibold">{d.rotuloAnterior}</span>{`: ${brl(d.anterior)}`}</p>
    </div>
  )
}

/** Receita diária do período atual sobreposta à do anterior (dia 1 com dia 1). Só props. */
export default function ReceitaComparadaChart({ serie }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 break-inside-avoid">
      <h2 className="text-sm font-bold text-slate-900">Receita diária: atual × anterior</h2>
      <p className="text-xs text-slate-400 mb-4">Cada ponto alinha o mesmo dia relativo dos dois períodos; dias de Brasília. Dia sem valor legível fica em branco.</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <Tooltip content={<Dica />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area name="Período atual" dataKey="atual" type="monotone" stroke="#0086FF" fill="#0086FF" fillOpacity={0.12} strokeWidth={2} connectNulls={false} />
            <Line name="Período anterior" dataKey="anterior" type="monotone" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} dot={false} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
