import { useEffect, useState } from 'react'
import { PiggyBank } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../magalu/StatusBadge'
import { brl, inteiro } from '../magalu/formatos'
import { pct, corMargem } from '../performance/percentual'
import { CURVA_TONES, MOTIVO_INFO } from '../../features/lucratividade/lucratividade.constants'

function Faixa({ r }) {
  if (r.faixa === 'pendente') return <StatusBadge label="Pendente" tone="amber" />
  if (r.faixa === 'negativo') return <StatusBadge label="Prejuízo" tone="rose" />
  if (r.faixa === 'zero') return <StatusBadge label="Sem lucro" tone="slate" />
  return <StatusBadge label={`Lucro ${r.curvaLucro}`} tone={CURVA_TONES[r.curvaLucro]} />
}

export default function LucroTable({ rows, loading, pageSize = 50 }) {
  const [pagina, setPagina] = useState(0)
  const paginas = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { if (pagina >= paginas) setPagina(0) }, [pagina, paginas])

  if (loading && rows.length === 0) return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando lucratividade…</div>
  if (rows.length === 0) return <div className="bg-white rounded-xl border border-slate-200"><EmptyState icon={PiggyBank} title="Nenhum SKU para mostrar" description="Sem vendas no período, ou nenhum SKU casa com o filtro." /></div>

  const visiveis = rows.slice(pagina * pageSize, (pagina + 1) * pageSize)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-semibold px-3 py-2.5">Produto</th>
              <th className="text-left font-semibold px-3 py-2.5">Faixa</th>
              <th className="text-left font-semibold px-3 py-2.5">Receita</th>
              <th className="text-right font-semibold px-3 py-2.5">Receita R$</th>
              <th className="text-right font-semibold px-3 py-2.5">Unid.</th>
              <th className="text-right font-semibold px-3 py-2.5">MC R$</th>
              <th className="text-right font-semibold px-3 py-2.5">MC %</th>
              <th className="text-right font-semibold px-3 py-2.5">% do lucro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((r) => (
              <tr key={r.sku} className={r.faixa === 'negativo' ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-slate-50'}>
                <td className="px-3 py-2.5 max-w-xs">
                  <p className="truncate text-slate-800">{r.titulo ?? 'Sem título no catálogo'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{r.sku}</p>
                  {r.faixa === 'pendente' && (
                    <p className="text-[11px] text-amber-700">{`Falta: ${r.faltando.map((f) => MOTIVO_INFO[f]?.label ?? f).join(', ')}`}</p>
                  )}
                </td>
                <td className="px-3 py-2.5"><Faixa r={r} /></td>
                <td className="px-3 py-2.5">{r.curvaReceita ? <StatusBadge label={r.curvaReceita} tone={CURVA_TONES[r.curvaReceita]} /> : '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{brl(r.receita)}{r.receitaParcial && <span className="text-amber-500">*</span>}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{inteiro(r.unidades)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${corMargem(r.mcPct)}`}>{brl(r.mc)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${corMargem(r.mcPct)}`}>{pct(r.mcPct)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{pct(r.participacaoLucro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
        <span>{`${rows.length} SKU(s) · * receita parcial`}</span>
        {paginas > 1 && (
          <div className="flex gap-2">
            <button type="button" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={pagina >= paginas - 1} onClick={() => setPagina((p) => p + 1)} className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40">Próxima</button>
          </div>
        )}
      </div>
    </div>
  )
}
