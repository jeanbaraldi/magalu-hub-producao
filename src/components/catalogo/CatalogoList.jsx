// Catálogo do Gestor Magalu no desenho do Catálogo do Gestor ML (Products.jsx):
// busca + filtro de SKUs + ordenação e um card por produto (SKU). Componente burro.
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpDown, Package, Search } from 'lucide-react'
import { cn, formatCurrency, formatNumber } from '../../lib/utils'
import { ORDENS_CATALOGO, PRODUTOS_POR_PAGINA, marginRating } from '../../features/catalogo/catalogo.constants'

function pendencias(r) {
  const out = []
  if (!r.temCusto) out.push('Sem custo cadastrado')
  const outros = (r.faltando30 ?? []).filter((f) => f !== 'custo do produto')
  if ((r.vendas30 ?? 0) > 0 && r.contribuicao30 == null && outros.length) out.push(`Falta ${outros.join(', ')}`)
  return out
}

export default function CatalogoList({ rows, counts, aba, onAba, ordem, onOrdem, busca, onBusca, loading, error, podeVerValores }) {
  const [visiveis, setVisiveis] = useState(PRODUTOS_POR_PAGINA)
  useEffect(() => { setVisiveis(PRODUTOS_POR_PAGINA) }, [aba, ordem, busca])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nome ou SKU..." aria-label="Buscar produtos" value={busca} onChange={(e) => onBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mg-blue focus:border-transparent" />
        </div>
        <select aria-label="Filtrar produtos por SKU" value={aba} onChange={(e) => onAba(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mg-blue">
          <option value="todos">Todos os SKUs</option>
          <option value="ativos">Publicados ({counts.ativos})</option>
          {podeVerValores && <option value="com_custo">Com custo ({counts.com_custo})</option>}
          {podeVerValores && <option value="sem_custo">Sem custo ({counts.sem_custo})</option>}
          <option value="pausados">Não publicados ({counts.pausados})</option>
        </select>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={13} className="text-slate-400" />
          <select value={ordem} onChange={(e) => onOrdem(e.target.value)} aria-label="Ordenar"
            className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mg-blue cursor-pointer">
            {ORDENS_CATALOGO.map((o) => <option key={o.value} value={o.value}>Ordenar: {o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-2 animate-fade-in">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-4 bg-slate-100 rounded" />
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
                <div className="hidden sm:flex gap-6">
                  <div className="h-6 w-20 bg-slate-100 rounded" />
                  <div className="h-6 w-16 bg-slate-100 rounded" />
                  <div className="h-6 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!loading && counts.todos === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-700 mb-1">Nenhum produto</p>
          <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Sincronize o catálogo da loja Magalu para ver os produtos.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-2">
          {rows.slice(0, visiveis).map((p, idx) => {
            const issues = podeVerValores ? pendencias(p) : []
            return (
              <div key={p.sku} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-100 w-8 text-center flex-shrink-0">{idx + 1}</span>
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    {p.imagem ? <img src={p.imagem} alt={p.titulo} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{p.titulo}</h3>
                    <p className="text-xs mt-1 break-all text-slate-600">SKU: {p.sku}</p>
                    {podeVerValores && p.temCusto && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs text-slate-400">
                        <span className="text-slate-300">•</span>
                        <span>Custo: {formatCurrency(p.custo)}/un</span>
                      </div>
                    )}
                    {issues.length > 0 && <p className="text-xs text-amber-700 mt-1">{issues.join(' · ')}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${p.ativo ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {p.statusInfo.label}
                      </span>
                      {p.curva && <span className="text-[11px] font-semibold text-slate-400">Curva {p.curva}</span>}
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
                    <div className="text-center min-w-[80px]">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Receita</p>
                      <p className="text-sm font-bold text-slate-900">{p.receita30 != null ? formatCurrency(p.receita30) : '—'}</p>
                    </div>
                    {podeVerValores && p.temCusto && (
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Contribuição</p>
                        <p className={cn('text-sm font-bold', p.contribuicao30 == null || p.contribuicao30 >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {p.contribuicao30 != null ? formatCurrency(p.contribuicao30) : (p.vendas30 ?? 0) > 0 ? 'Pendente' : '—'}
                        </p>
                      </div>
                    )}
                    {p.margem30 != null && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Margem</p>
                        <span className={cn('inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full', marginRating(p.margem30))}>{p.margem30.toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="text-center min-w-[50px]">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Vendas</p>
                      <p className="text-sm font-bold text-slate-900">{p.vendas30 != null ? formatNumber(p.vendas30) : '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="lg:hidden flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div><span className="text-slate-400">Receita: </span><span className="font-bold text-slate-900">{p.receita30 != null ? formatCurrency(p.receita30) : '—'}</span></div>
                  {podeVerValores && p.temCusto && (
                    <div>
                      <span className="text-slate-400">Contribuição: </span>
                      <span className={cn('font-bold', p.contribuicao30 == null || p.contribuicao30 >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {p.contribuicao30 != null ? formatCurrency(p.contribuicao30) : (p.vendas30 ?? 0) > 0 ? 'Pendente' : '—'}
                      </span>
                    </div>
                  )}
                  <div><span className="text-slate-400">Vendas: </span><span className="font-bold text-slate-900">{p.vendas30 != null ? formatNumber(p.vendas30) : '—'}</span></div>
                </div>
              </div>
            )
          })}
          {visiveis < rows.length && (
            <div className="pt-2 text-center">
              <button type="button" onClick={() => setVisiveis((v) => v + PRODUTOS_POR_PAGINA)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl shadow-sm border border-slate-200">
                Mostrar mais ({rows.length - visiveis} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && rows.length === 0 && counts.todos > 0 && (
        <p className="text-center text-sm text-slate-400 py-8">
          {busca ? `Nenhum produto encontrado para "${busca}" com os filtros selecionados.` : 'Nenhum produto com os filtros selecionados.'}
        </p>
      )}
    </>
  )
}
