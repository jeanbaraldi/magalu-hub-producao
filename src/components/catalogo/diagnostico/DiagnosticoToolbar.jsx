// Toolbar da aba Diagnóstico: filtros combináveis, busca e atualizar. Igual ao Gestor ML.
import { RefreshCw, Search } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { CURVE_OPTIONS, FAMILIA_CONFIG, FAMILIA_ORDER, SEVERIDADE_CONFIG, SEVERIDADE_ORDER, SIGNAL_DEFS } from '../../../features/catalogo/diagnostico.constants'

const SELECT_CLASS = 'text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mg-blue cursor-pointer'

export default function DiagnosticoToolbar({ filters, onFiltersChange, computing, onRefresh }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={filters.sinal ?? ''} onChange={(e) => onFiltersChange({ sinal: e.target.value || null })} className={SELECT_CLASS} aria-label="Filtrar por sinal">
        <option value="">Todos os sinais</option>
        {FAMILIA_ORDER.map((fam) => (
          <optgroup key={fam} label={FAMILIA_CONFIG[fam].label}>
            {SIGNAL_DEFS.filter((d) => d.familia === fam).map((d) => <option key={d.codigo} value={d.codigo}>{d.nome}</option>)}
          </optgroup>
        ))}
      </select>

      <select value={filters.severidade ?? ''} onChange={(e) => onFiltersChange({ severidade: e.target.value || null })} className={SELECT_CLASS} aria-label="Filtrar por severidade">
        <option value="">Toda severidade</option>
        {SEVERIDADE_ORDER.map((s) => <option key={s} value={s}>{SEVERIDADE_CONFIG[s].label}</option>)}
      </select>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Filtrar por curva ABC">
        {CURVE_OPTIONS.map((c) => (
          <button key={c} type="button" onClick={() => onFiltersChange({ curva: filters.curva === c ? null : c })} aria-pressed={filters.curva === c}
            className={cn('w-8 py-1.5 text-xs font-bold rounded-[10px] transition-colors', filters.curva === c ? 'bg-mg-blue text-white' : 'text-slate-500 hover:text-slate-800')}>
            {c}
          </button>
        ))}
      </div>

      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Título ou SKU..." aria-label="Buscar no diagnóstico" value={filters.busca} onChange={(e) => onFiltersChange({ busca: e.target.value })}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mg-blue" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button type="button" onClick={onRefresh} disabled={computing}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw size={13} className={computing ? 'animate-spin' : ''} />
          {computing ? 'Recalculando…' : 'Atualizar'}
        </button>
      </div>
    </div>
  )
}
