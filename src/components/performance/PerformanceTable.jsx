import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, BarChart2 } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../magalu/StatusBadge'
import { brl, inteiro } from '../magalu/formatos'
import { pct, corMargem } from './percentual'
import { CURVA_TONES, TENDENCIA_INFO } from '../../features/performance/performance.constants'

const COLUNAS = [
  { chave: 'titulo', label: 'Produto', alinhar: 'left' },
  { chave: null, label: 'Curva', alinhar: 'left' },
  { chave: 'tendencia', label: 'Tendência', alinhar: 'left' },
  { chave: 'receita', label: 'Receita' },
  { chave: 'unidades', label: 'Unid.' },
  { chave: 'ticket', label: 'Ticket' },
  { chave: 'custo', label: 'Custo', valor: true },
  { chave: 'comissao', label: 'Comissão', valor: true },
  { chave: 'imposto', label: 'Imposto', valor: true },
  { chave: 'frete', label: 'Frete', valor: true },
  { chave: 'mc', label: 'MC R$', valor: true },
  { chave: 'mcPct', label: 'MC %', valor: true },
]

/** Tabela por SKU, ordenável. A ordenação é decidida pela página (onOrdenar). */
export default function PerformanceTable({ rows, loading, podeVerValores, ordem, onOrdenar, pageSize = 50 }) {
  const [pagina, setPagina] = useState(0)
  const paginas = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { if (pagina >= paginas) setPagina(0) }, [pagina, paginas])

  if (loading && rows.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando performance…</div>
  }
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <EmptyState icon={BarChart2} title="Nenhum SKU vendido no período" description="Pedidos cancelados não contam. Se a loja acabou de ser conectada, rode a sincronização em Configurações." />
      </div>
    )
  }
  const cols = COLUNAS.filter((c) => podeVerValores || !c.valor)
  const visiveis = rows.slice(pagina * pageSize, (pagina + 1) * pageSize)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {cols.map((c) => {
                const ativo = c.chave && ordem.chave === c.chave
                return (
                  <th key={c.label} className={`font-semibold px-3 py-2.5 whitespace-nowrap ${c.alinhar === 'left' ? 'text-left' : 'text-right'}`} aria-sort={ativo ? (ordem.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {c.chave ? (
                      <button type="button" onClick={() => onOrdenar(c.chave)} className="inline-flex items-center gap-1 hover:text-slate-800">
                        {c.label}
                        {ativo && (ordem.dir === 'asc' ? <ArrowUp aria-hidden="true" size={11} /> : <ArrowDown aria-hidden="true" size={11} />)}
                      </button>
                    ) : c.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((r) => {
              const tend = r.tendencia?.tipo ? TENDENCIA_INFO[r.tendencia.tipo] : null
              const motivo = r.mc == null && r.faltando?.length ? `Indisponível: falta ${r.faltando.join(', ')}` : undefined
              return (
                <tr key={r.sku} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 max-w-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.imagem ? <img src={r.imagem} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 bg-slate-100" /> : <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="truncate text-slate-800">{r.titulo ?? 'Sem título no catálogo'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{r.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{r.curva ? <StatusBadge label={r.curva} tone={CURVA_TONES[r.curva]} /> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {tend ? <StatusBadge label={r.tendencia.pct != null ? `${tend.label} ${pct(r.tendencia.pct, 0)}` : tend.label} tone={tend.tone} /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900" title={r.receitaParcial ? `${r.itensSemValor} item(ns) sem valor ficaram fora` : undefined}>
                    {brl(r.receita)}{r.receitaParcial && <span className="text-amber-500">*</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{inteiro(r.unidades)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{brl(r.ticket)}</td>
                  {podeVerValores && (
                    <>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{r.custoUnit == null ? <span className="text-amber-600 text-xs">sem custo</span> : brl(r.componentes.custo)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{brl(r.componentes.comissao)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{brl(r.componentes.imposto)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{r.semFrete ? <span className="text-slate-400 text-xs">sem frete</span> : brl(r.componentes.frete)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${corMargem(r.mcPct)}`} title={motivo}>{brl(r.mc)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${corMargem(r.mcPct)}`} title={motivo}>{pct(r.mcPct)}</td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
        <span>{`${rows.length} SKU(s) · * receita parcial (item sem valor legível). MC "—" passe o mouse para ver o que falta.`}</span>
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
