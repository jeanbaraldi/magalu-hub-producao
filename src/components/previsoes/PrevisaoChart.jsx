import { ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const n1 = (v) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v))

function Dica({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {d.real != null && <p className="text-slate-600">{`Vendido: ${n1(d.real)} un.`}</p>}
      {d.real == null && d.provavel != null && <p className="text-slate-600">{`Provável: ${n1(d.provavel)} un.`}</p>}
      {d.faixa && <p className="text-slate-400">{`Faixa: ${n1(d.faixa[0])} a ${n1(d.faixa[1])}`}</p>}
    </div>
  )
}

/** Histórico de unidades (90 dias) + projeção com faixa. Só props. */
export default function PrevisaoChart({ dados }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Unidades por dia: histórico e projeção</h2>
      <p className="text-xs text-slate-400 mb-4">Barras: vendido (90 dias fechados). Linha tracejada: provável. Faixa: conservador a agressivo, por dia.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
            <Tooltip content={<Dica />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area name="Faixa" dataKey="faixa" stroke="none" fill="#0086FF" fillOpacity={0.12} />
            <Bar name="Vendido" dataKey="real" fill="#94a3b8" maxBarSize={10} />
            <Line name="Provável" dataKey="provavel" stroke="#0086FF" strokeWidth={2} strokeDasharray="5 4" dot={false} type="monotone" connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
