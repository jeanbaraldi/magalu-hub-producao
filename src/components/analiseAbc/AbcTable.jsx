import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../magalu/StatusBadge'
import { pct } from '../performance/percentual'
import { CURVA_TONES, MOVIMENTO_INFO } from '../../features/analiseAbc/analiseAbc.constants'
import { fmtMetrica } from './fmt'

export default function AbcTable({ rows, metrica, loading, pageSize = 50 }) {
  const [pagina, setPagina] = useState(0)
  const paginas = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { if (pagina >= paginas) setPagina(0) }, [pagina, paginas])

  if (loading && rows.length === 0) return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando curva ABC…</div>
  if (rows.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200"><EmptyState icon={BarChart3} title="Nenhum SKU para mostrar" description="Sem vendas no período, ou nenhum SKU casa com o filtro." /></div>
  }
  const visiveis = rows.slice(pagina * pageSize, (pagina + 1) * pageSize)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-right font-semibold px-3 py-2.5">#</th>
              <th className="text-left font-semibold px-3 py-2.5">Produto</th>
              <th className="text-left font-semibold px-3 py-2.5">Classe</th>
              <th className="text-left font-semibold px-3 py-2.5">Anterior</th>
              <th className="text-right font-semibold px-3 py-2.5">{metrica === 'unidades' ? 'Unidades' : 'Receita'}</th>
              <th className="text-right font-semibold px-3 py-2.5">Participação</th>
              <th className="text-right font-semibold px-3 py-2.5">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((r) => {
              const mov = r.movimento ? MOVIMENTO_INFO[r.movimento] : null
              return (
                <tr key={r.sku} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">{r.posicao ?? '—'}</td>
                  <td className="px-3 py-2.5 max-w-xs">
                    <p className="truncate text-slate-800">{r.titulo ?? 'Sem título no catálogo'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{r.sku}</p>
                  </td>
                  <td className="px-3 py-2.5">{r.curva ? <StatusBadge label={r.curva} tone={CURVA_TONES[r.curva]} /> : <span className="text-xs text-slate-400">fora (sem valor)</span>}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-slate-500 mr-1.5">{r.curvaAnterior ?? '—'}</span>
                    {mov && <StatusBadge {...mov} />}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">{fmtMetrica(r.valor, metrica)}{r.parcial && <span className="text-amber-500" title="Dado parcial">*</span>}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{pct(r.participacao)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{pct(r.acumulado)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
        <span>{`${rows.length} SKU(s) · * dado parcial`}</span>
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
