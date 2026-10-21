import { ArrowUpDown, LayoutGrid, Layers } from 'lucide-react'
import SearchInput from '../ui/SearchInput'
import { cn } from '../../lib/utils'
import { ABAS, ORDENACOES, SUBFILTROS } from '../../features/anuncios/anuncios.constants'

/** Abas, sub-filtros, busca, modo de visão e ordenação. Só props. */
export default function AnunciosToolbar({ aba, onAba, contagens, sub, onSub, busca, onBusca, visao, onVisao, ordem, onOrdem }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Abas de anúncios" className="inline-flex flex-wrap bg-slate-100 rounded-xl p-1 gap-0.5">
          {ABAS.map((t) => (
            <button
              key={t.value} type="button" role="tab" aria-selected={aba === t.value} onClick={() => onAba(t.value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', aba === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >
              {`${t.label} (${contagens[t.value] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={busca} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar título, SKU ou marca..." />
        </div>
        <div role="group" aria-label="Modo de visão" className="inline-flex bg-white border border-slate-200 rounded-xl p-0.5">
          {[{ v: 'grade', Icone: LayoutGrid, rotulo: 'Grade' }, { v: 'familias', Icone: Layers, rotulo: 'Famílias' }].map(({ v, Icone, rotulo }) => (
            <button key={v} type="button" aria-pressed={visao === v} title={rotulo} aria-label={rotulo} onClick={() => onVisao(v)}
              className={cn('p-1.5 rounded-lg', visao === v ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700')}>
              <Icone aria-hidden="true" size={16} />
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm text-slate-700">
          <ArrowUpDown aria-hidden="true" size={14} className="text-slate-400" />
          <span className="sr-only">Ordenar por</span>
          <select value={ordem} onChange={(e) => onOrdem(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none">
            {ORDENACOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      {aba === 'ativos' && (
        <div role="group" aria-label="Sub-filtro" className="flex flex-wrap gap-1.5">
          {SUBFILTROS.map((s) => (
            <button key={s.value} type="button" aria-pressed={sub === s.value} onClick={() => onSub(s.value)}
              className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors', sub === s.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
