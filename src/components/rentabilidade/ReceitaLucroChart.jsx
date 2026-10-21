import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'
import { CORES } from '../../features/rentabilidade/rentabilidade.constants'

function Dica({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-slate-600">{`Receita: ${brl(d.receita)}`}</p>
      <p className="text-slate-600">{`Lucro estimado: ${d.lucro == null ? 'indisponível' : brl(d.lucro)}`}</p>
    </div>
  )
}

export default function ReceitaLucroChart({ diario, lucroDisponivel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Receita × lucro por dia</h2>
      <p className="text-xs text-slate-400 mb-4">
        {lucroDisponivel ? 'Lucro estimado com a mesma régua do total (dias de Brasília)' : 'Lucro indisponível enquanto faltar custo, comissão ou imposto: só a receita é exibida'}
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={diario} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <Tooltip content={<Dica />} />
            <Bar dataKey="receita" fill={CORES.receita} radius={[4, 4, 0, 0]} maxBarSize={28} />
            {lucroDisponivel && <Line dataKey="lucro" stroke={CORES.lucro} strokeWidth={2} dot={false} type="monotone" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
