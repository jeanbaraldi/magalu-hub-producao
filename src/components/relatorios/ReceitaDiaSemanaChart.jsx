import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{d.nomeCompleto}</p>
      <p className="text-slate-600">{`Total: ${brl(d.receita)}`}</p>
      <p className="text-slate-600">{`Média por dia: ${brl(d.media)}`}</p>
      <p className="text-slate-400">{`${d.ocorrencias} dia(s) no período`}</p>
    </div>
  )
}

/** Receita do período atual por dia da semana (média por ocorrência). Só props. */
export default function ReceitaDiaSemanaChart({ dados }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 break-inside-avoid">
      <h2 className="text-sm font-bold text-slate-900">Receita por dia da semana</h2>
      <p className="text-xs text-slate-400 mb-4">Média por dia, período atual (cada dia da semana pode aparecer um número diferente de vezes)</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <Tooltip content={<Dica />} />
            <Bar dataKey="media" fill="#0086FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
