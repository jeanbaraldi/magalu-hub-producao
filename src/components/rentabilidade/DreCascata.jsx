import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'
import { pct } from '../performance/percentual'
import { CORES } from '../../features/rentabilidade/rentabilidade.constants'

function textoValor(s) {
  if (s.naoConfigurado) return s.rotuloAusente ?? 'não configurado'
  if (s.valor == null) return 'Indisponível'
  const sinal = s.tipo === 'saida' ? '− ' : ''
  return `${sinal}${brl(s.valor)}${s.parcial ? ' (parcial)' : ''}`
}

/** Cascata receita → lucro. Barra sem posição calculável não é desenhada (nunca vira zero). */
export default function DreCascata({ passos }) {
  const dados = passos.map((s) => ({
    ...s,
    invisivel: s.base ?? 0,
    visivel: s.altura == null ? 0 : Math.abs(s.altura),
    cor: s.chave === 'lucro' && s.valor != null && s.valor < 0 ? CORES.prejuizo : CORES[s.chave],
  }))
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Da receita ao lucro</h2>
      <p className="text-xs text-slate-400 mb-4">Só vendas (cancelados fora), percentuais sobre a receita</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-4">
        {passos.map((s) => (
          <div key={s.chave} className={`rounded-lg px-3 py-2 ${s.tipo === 'total' ? 'bg-slate-50' : ''}`}>
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className={`text-sm font-bold tabular-nums ${s.valor == null ? 'text-slate-400' : s.chave === 'lucro' && s.valor < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{textoValor(s)}</p>
            <p className="text-[11px] text-slate-400 tabular-nums">{s.chave === 'receita' ? '100%' : pct(s.pct)}</p>
          </div>
        ))}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(_v, _n, item) => [textoValor(item.payload), item.payload.label]} labelFormatter={() => ''} />
            <Bar dataKey="invisivel" stackId="a" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="visivel" stackId="a" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {dados.map((d) => <Cell key={d.chave} fill={d.cor} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
