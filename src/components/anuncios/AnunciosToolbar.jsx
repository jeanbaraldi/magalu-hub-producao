import { useState } from 'react'
import { ArrowUpDown, ChevronDown, GitBranch, LayoutGrid, Search } from 'lucide-react'
import { ABAS, ORDENACOES, SUBFILTROS } from '../../features/anuncios/anuncios.constants'

// Cor do chip ativo por sub-filtro, como no Gestor ML.
const COR_SUB = {
  com_desconto: 'bg-rose-50 text-rose-700 border-rose-200',
  vendeu: 'bg-violet-50 text-violet-700 border-violet-200',
  sem_estoque: 'bg-red-50 text-red-700 border-red-200',
  estoque_baixo: 'bg-amber-50 text-amber-700 border-amber-200',
  full: 'bg-blue-50 text-blue-700 border-blue-200',
  familia: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

/** Abas, busca, visão, ordenação e sub-filtros no formato do Gestor ML. Só props. */
export default function AnunciosToolbar({ aba, onAba, contagens, contagensSub, sub, onSub, busca, onBusca, visao, onVisao, ordem, onOrdem }) {
  const [menu, setMenu] = useState(false)
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div role="tablist" aria-label="Abas de anúncios" className="flex items-center bg-slate-100 rounded-xl p-1 flex-shrink-0 max-w-full overflow-x-auto">
          {ABAS.map((t) => (
            <button
              key={t.value} type="button" role="tab" aria-selected={aba === t.value} onClick={() => onAba(t.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aba === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {`${t.label} (${contagens[t.value] ?? 0})`}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search aria-hidden="true" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            aria-label="Buscar anúncios"
            placeholder="Buscar título, SKU ou marca..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mg-blue focus:border-transparent bg-white"
          />
        </div>

        <div className="flex items-center bg-slate-100 rounded-xl p-0.5" role="radiogroup" aria-label="Modo de visualização">
          <button type="button" role="radio" aria-checked={visao === 'grade'} aria-label="Visualização em grade" title="Grade" onClick={() => onVisao('grade')}
            className={`p-1.5 rounded-lg transition-colors ${visao === 'grade' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>
            <LayoutGrid aria-hidden="true" size={14} />
          </button>
          <button type="button" role="radio" aria-checked={visao === 'familias'} aria-label="Visualização por família" title="Famílias" onClick={() => onVisao('familias')}
            className={`p-1.5 rounded-lg transition-colors ${visao === 'familias' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}>
            <GitBranch aria-hidden="true" size={14} />
          </button>
        </div>

        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} aria-haspopup="listbox" aria-expanded={menu}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
            <ArrowUpDown aria-hidden="true" size={12} />
            {ORDENACOES.find((o) => o.value === ordem)?.label}
            <ChevronDown aria-hidden="true" size={10} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div role="listbox" aria-label="Ordenar por" className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[180px]">
                {ORDENACOES.map((o) => (
                  <button key={o.value} type="button" role="option" aria-selected={ordem === o.value}
                    onClick={() => { onOrdem(o.value); setMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${ordem === o.value ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {aba === 'ativos' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap" role="group" aria-label="Filtrar ativos">
          <span className="text-xs text-slate-400 mr-1">Filtrar:</span>
          {SUBFILTROS.filter((s) => s.value === 'todos' || (contagensSub?.[s.value] ?? 0) > 0).map((s) => (
            <button key={s.value} type="button" aria-pressed={sub === s.value} onClick={() => onSub(s.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${sub === s.value
                ? COR_SUB[s.value] ?? 'bg-white text-slate-800 border-slate-300 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}>
              {`${s.label} (${contagensSub?.[s.value] ?? 0})`}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
