// Card de anúncio no desenho do ListingCard do Gestor ML. Na Magalu o SKU é o anúncio.
// Componente burro: recebe a linha de mapCatalogo.
import { AlertCircle, Package, ShoppingBag, Tag, Zap } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { marginColorClass } from '../../features/catalogo/catalogo.constants'
import UnitCostBreakdown from './UnitCostBreakdown'

export default function AnuncioCard({ row, podeVerValores }) {
  const unit = row.unit
  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all group ${
      row.pausado && (row.vendas30 ?? 0) > 0 ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Header: Thumbnail + Title */}
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {row.imagem ? <img src={row.imagem} alt={row.titulo} className="w-full h-full object-contain" loading="lazy" /> : <Tag size={20} className="text-slate-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">{row.titulo}</p>
          <span className="text-[11px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded font-mono">SKU: {row.sku}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${row.statusInfo.cls}`}>
          <Tag size={10} />
          {row.statusInfo.label}
        </span>
        {row.curva && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
            row.curva === 'A' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : row.curva === 'B' ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-slate-600 bg-slate-50 border-slate-200'
          }`}>Curva {row.curva}</span>
        )}
        {(row.vendas30 ?? 0) > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-violet-600 bg-violet-50">
            <ShoppingBag size={9} />
            {row.vendas30} vendido{row.vendas30 !== 1 ? 's' : ''} (30d)
          </span>
        )}
        {row.descontoPct != null && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-rose-600 bg-rose-50">
            <Zap size={9} />
            -{Math.round(row.descontoPct)}% do preço de lista
          </span>
        )}
        {podeVerValores && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${row.temCusto ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
            <Package size={9} />
            {row.temCusto ? `Custo ${formatCurrency(row.custo)}` : 'Sem custo'}
          </span>
        )}
      </div>

      {/* Não publicado com vendas recentes */}
      {row.pausado && (row.vendas30 ?? 0) > 0 && (
        <div className="flex items-center gap-2 mt-3 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">
            {row.vendas30} venda{row.vendas30 !== 1 ? 's' : ''} nos últimos 30 dias — considere publicar de novo
          </span>
        </div>
      )}

      {/* Metrics row: Price + Receita + Stock */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-50">
        <div>
          <p className="text-base font-bold text-slate-900">{row.preco != null ? formatCurrency(row.preco) : '—'}</p>
          {row.descontoPct != null && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 line-through">{formatCurrency(row.precoLista)}</span>
              <span className="text-[11px] font-semibold text-emerald-600">-{Math.round(row.descontoPct)}%</span>
            </div>
          )}
        </div>
        <div className="text-center">
          {row.receita30 != null ? (
            <>
              <p className="text-sm font-bold text-slate-700">{formatCurrency(row.receita30)}</p>
              <p className="text-[11px] text-slate-400">receita (30d)</p>
            </>
          ) : <p className="text-[11px] text-slate-300 mt-1">—</p>}
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${
            row.estoque == null ? 'text-slate-300' : row.estoque === 0 ? 'text-red-500' : row.estoque <= 3 ? 'text-amber-600' : 'text-slate-700'
          }`}>{row.estoque ?? '—'}</p>
          <p className="text-[11px] text-slate-400">em estoque</p>
        </div>
      </div>

      {/* Margem de contribuição por unidade (destaque) */}
      {podeVerValores && unit && (
        <>
          <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
            title={unit.mc != null ? 'Preço − comissão − frete − custo − impostos' : `Falta: ${unit.faltando.join(', ')}`}>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Margem de contribuição</p>
              <p className="text-[11px] text-slate-400 truncate">
                {unit.mc != null ? `por unidade${unit.semFrete ? ', sem frete configurado' : ''}` : `falta ${unit.faltando.join(', ')}`}
              </p>
            </div>
            {unit.mc != null ? (
              <div className="text-right flex-shrink-0">
                <p className={`text-xl font-bold leading-tight ${marginColorClass(unit.mcPct)}`}>{formatCurrency(unit.mc)}</p>
                <p className={`text-xs font-semibold ${marginColorClass(unit.mcPct)}`}>{unit.mcPct != null ? `${unit.mcPct.toFixed(1)}%` : '—'}</p>
              </div>
            ) : <p className="text-xl font-bold text-slate-300 flex-shrink-0">—</p>}
          </div>
          <div className="mt-1.5 px-3">
            <UnitCostBreakdown unit={unit} compact />
          </div>
        </>
      )}
    </div>
  )
}
