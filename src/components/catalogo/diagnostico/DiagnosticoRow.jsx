// Linha da tabela de Diagnóstico, expansível. Igual ao Gestor ML.
import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight, Eye, Package } from 'lucide-react'
import { cn, formatCurrency, formatNumber } from '../../../lib/utils'
import { COBERTURA_ALERT_DIAS, SEVERIDADE_CONFIG } from '../../../features/catalogo/diagnostico.constants'
import SignalBadge from './SignalBadge'

const MAX_BADGES = 3

function VarArrow({ pct }) {
  if (pct == null) return null
  const up = pct >= 0
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold', up ? 'text-emerald-600' : 'text-red-600')}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

export default function DiagnosticoRow({ row, onOpenEvidence }) {
  const [open, setOpen] = useState(false)
  const sev = row.severidadeMax ? SEVERIDADE_CONFIG[row.severidadeMax] : null
  const badges = row.sinais.slice(0, MAX_BADGES)
  const extra = row.sinais.length - badges.length
  const coberturaBaixa = row.coberturaDias != null && row.coberturaDias < COBERTURA_ALERT_DIAS

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
              aria-label={open ? 'Recolher detalhes' : 'Expandir detalhes'} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
              {row.imagem
                ? <img src={row.imagem} alt="" className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-slate-300" /></div>}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-[320px]" title={row.titulo}>{row.titulo}</p>
              <p className="text-[10px] text-slate-400 truncate">
                SKU {row.sku}{row.pausado && ` · ${row.statusLabel.toLowerCase()}`}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1 flex-wrap">
            {badges.map((c) => <SignalBadge key={c} codigo={c} />)}
            {extra > 0 && <span className="text-[10px] font-bold text-slate-400">+{extra}</span>}
          </div>
        </td>
        <td className="px-3 py-2.5">
          {sev
            ? <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold', sev.badge)}>{sev.label}</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5 text-right hidden sm:table-cell">
          <span className="text-xs font-bold text-slate-900">{formatNumber(row.vendas7)}</span>
          <span className="ml-1"><VarArrow pct={row.vendas7VarPct} /></span>
        </td>
        <td className="px-3 py-2.5 text-right hidden sm:table-cell">
          <span className="text-xs font-bold text-slate-900">{formatNumber(row.vendas30)}</span>
          <span className="ml-1"><VarArrow pct={row.vendas30VarPct} /></span>
        </td>
        <td className="px-3 py-2.5 text-right hidden md:table-cell">
          <span className="text-xs font-bold text-slate-900">{row.faturamento30 != null ? formatCurrency(row.faturamento30) : '—'}</span>
        </td>
        <td className="px-3 py-2.5 text-right hidden md:table-cell">
          {row.coberturaDias != null
            ? <span className={cn('text-xs font-bold', coberturaBaixa ? 'text-red-600' : 'text-slate-700')}>{formatNumber(row.coberturaDias)}d</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5 text-center hidden md:table-cell">
          {row.curva
            ? <span className={cn('inline-block w-5 h-5 rounded-md text-[10px] font-black leading-5', row.curva === 'A' ? 'bg-emerald-100 text-emerald-700' : row.curva === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>{row.curva}</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-3 py-2.5 text-right">
          <button type="button" onClick={() => onOpenEvidence(row)}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg">
            <Eye size={12} />
            <span className="hidden sm:inline">Evidência</span>
          </button>
        </td>
      </tr>

      {open && (
        <tr className="border-b border-slate-100 bg-slate-50/40">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div><p className="text-[10px] text-slate-400 uppercase">Vendas 7d</p><p className="font-bold">{formatNumber(row.vendas7)} <VarArrow pct={row.vendas7VarPct} /></p></div>
              <div><p className="text-[10px] text-slate-400 uppercase">Vendas 30d</p><p className="font-bold">{formatNumber(row.vendas30)} <VarArrow pct={row.vendas30VarPct} /></p></div>
              <div><p className="text-[10px] text-slate-400 uppercase">Faturamento 30d</p><p className="font-bold">{row.faturamento30 != null ? formatCurrency(row.faturamento30) : '—'}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase">Estoque</p><p className="font-bold">{row.estoque != null ? formatNumber(row.estoque) : '—'}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase">Cobertura</p><p className={cn('font-bold', coberturaBaixa && 'text-red-600')}>{row.coberturaDias != null ? `${formatNumber(row.coberturaDias)} dias` : '—'}</p></div>
              <div><p className="text-[10px] text-slate-400 uppercase">Margem 30d</p><p className="font-bold">{row.margemPct != null ? `${row.margemPct.toFixed(1)}%` : '—'}</p></div>
            </div>
            {row.sinais.length > MAX_BADGES && (
              <div className="flex items-center gap-1 flex-wrap mt-3 pt-2 border-t border-slate-100">
                {row.sinais.map((c) => <SignalBadge key={c} codigo={c} />)}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
