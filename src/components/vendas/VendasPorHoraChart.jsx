import { ResponsiveContainer, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { formatCurrencyShort } from '../../lib/utils'
import { brl } from '../magalu/formatos'
import { HORA_CORES } from '../../features/vendas/vendas.constants'

function Dica({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {d.futuro
        ? <p className="text-slate-400">Hora ainda não chegou</p>
        : <>
          <p className="text-slate-600">{`Hoje: ${brl(d.receita)} (${d.pedidos ?? '—'} pedido(s))`}</p>
        </>}
      <p className="text-slate-400">{`Ontem: ${brl(d.receitaOntem)}`}</p>
    </div>
  )
}

const LEGENDA = [
  { chave: 'passado', rotulo: 'Passado' },
  { chave: 'agora', rotulo: 'Agora' },
  { chave: 'futuro', rotulo: 'Futuro' },
]

/** 24 barras de receita por hora (BRT): passado, hora atual em destaque, futuro apagado. Só props. */
export default function VendasPorHoraChart({ horas }) {
  const dados = horas.map((h) => ({ ...h, barra: h.futuro ? 0 : h.receita }))
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Vendas por hora</h2>
          <p className="text-xs text-slate-400">Receita por faixa horária (horário de Brasília); a linha tracejada é o dia de ontem inteiro</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {LEGENDA.map((l) => (
            <span key={l.chave} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border border-slate-200" style={{ backgroundColor: HORA_CORES[l.chave] }} />
              {l.rotulo}
            </span>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={1} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={72} />
            <Tooltip content={<Dica />} />
            <Bar dataKey="barra" radius={[4, 4, 0, 0]} maxBarSize={22}>
              {dados.map((d) => (
                <Cell key={d.hora} fill={HORA_CORES[d.estado]} />
              ))}
            </Bar>
            <Line dataKey="receitaOntem" stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1.5} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
