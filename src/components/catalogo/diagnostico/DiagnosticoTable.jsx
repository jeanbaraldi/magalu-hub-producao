// Tabela da aba Diagnóstico: cabeçalhos ordenáveis + paginação. Igual ao Gestor ML.
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { DIAG_PAGE_SIZE } from '../../../features/catalogo/diagnostico.constants'
import DiagnosticoRow from './DiagnosticoRow'

function HeaderCell({ label, sortable, active, dir, onClick, align = 'left', className }) {
  return (
    <th className={cn('px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap', align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left', className)}>
      {sortable ? (
        <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-0.5 uppercase hover:text-slate-700', active && 'text-slate-900')}>
          {label}
          {active && (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
        </button>
      ) : label}
    </th>
  )
}

export default function DiagnosticoTable({ rows, sortKey, sortDir, onSortChange, page, onPageChange, onOpenEvidence }) {
  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / DIAG_PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = rows.slice(safePage * DIAG_PAGE_SIZE, (safePage + 1) * DIAG_PAGE_SIZE)
  const sortable = (key, label, className = '') => (
    <HeaderCell label={label} sortable align="right" className={className} active={sortKey === key} dir={sortDir} onClick={() => onSortChange(key)} />
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <HeaderCell label="Produto" />
              <HeaderCell label="Sinais" />
              <HeaderCell label="Sev." />
              {sortable('vendas7', 'Vendas 7d', 'hidden sm:table-cell')}
              {sortable('vendas30', 'Vendas 30d', 'hidden sm:table-cell')}
              {sortable('faturamento30', 'Fat. 30d', 'hidden md:table-cell')}
              {sortable('coberturaDias', 'Cobertura', 'hidden md:table-cell')}
              <HeaderCell label="ABC" align="center" className="hidden md:table-cell" />
              <HeaderCell label="" align="right" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => <DiagnosticoRow key={row.sku} row={row} onOpenEvidence={onOpenEvidence} />)}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
          <span>{`${safePage * DIAG_PAGE_SIZE + 1}–${Math.min((safePage + 1) * DIAG_PAGE_SIZE, total)} de ${total}`}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage === 0} onClick={() => onPageChange(safePage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50" aria-label="Página anterior">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2 font-semibold text-slate-700">{`${safePage + 1}/${pages}`}</span>
            <button type="button" disabled={safePage >= pages - 1} onClick={() => onPageChange(safePage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50" aria-label="Próxima página">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
