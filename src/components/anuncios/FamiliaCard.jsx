import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronUp, GitBranch, ShoppingBag, Tag } from 'lucide-react'
import AnuncioCard from './AnuncioCard'
import { brl, inteiro } from '../magalu/formatos'

/**
 * Família de variações (mesmo group.id na Magalu), no formato do card de família do
 * Gestor ML: resumo agregado e, aberto, o card completo de cada variação. Só props.
 */
export default function FamiliaCard({ familia: f }) {
  const [aberta, setAberta] = useState(false)
  const faixa = f.precoMin == null ? '—'
    : f.precoMin === f.precoMax ? brl(f.precoMin) : `${brl(f.precoMin)} – ${brl(f.precoMax)}`
  const ativos = f.membros.filter((m) => m.ativo).length
  const total = f.membros.length
  const temPromo = f.membros.some((m) => m.descontoPct != null)
  const corAtivos = ativos === total ? 'text-emerald-600 bg-emerald-50' : ativos > 0 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
  const alternar = () => setAberta((v) => !v)

  return (
    <div className={`bg-white rounded-xl border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all ${aberta ? 'lg:col-span-2 xl:col-span-3' : ''}`}>
      <div
        role="button" tabIndex={0} aria-expanded={aberta}
        aria-label={`${aberta ? 'Recolher' : 'Expandir'} família ${f.pai.titulo ?? f.pai.sku}`}
        className="p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 rounded-xl"
        onClick={alternar}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar() } }}
      >
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {f.pai.imagem
              ? <img src={f.pai.imagem} alt={f.pai.titulo ?? ''} loading="lazy" className="w-full h-full object-contain" />
              : <Tag aria-hidden="true" size={20} className="text-slate-300" />}
            <span aria-hidden="true" className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{total}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">{f.pai.titulo ?? f.pai.sku}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-indigo-600 bg-indigo-50">
                <GitBranch aria-hidden="true" size={10} />{`${total} variações`}
              </span>
              {temPromo && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-rose-600 bg-rose-50">Promo</span>}
              {f.pai.marca && <span className="text-[10px] text-slate-400">{f.pai.marca}</span>}
            </div>
          </div>
          <div className="flex-shrink-0 p-1 text-slate-400" aria-hidden="true">
            {aberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${corAtivos}`}>
            <CheckCircle aria-hidden="true" size={10} />{`${ativos}/${total} ativos`}
          </span>
          {f.vendidos30 > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-violet-600 bg-violet-50">
              <ShoppingBag aria-hidden="true" size={9} />{`${inteiro(f.vendidos30)} vendido${f.vendidos30 !== 1 ? 's' : ''} (30d)`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div>
            <p className="text-base font-bold text-slate-900 tabular-nums">{faixa}</p>
            <p className="text-xs text-slate-400">
              {f.estoqueTotal == null
                ? `${f.estoqueDesconhecido} variação(ões) sem estoque informado`
                : `${inteiro(f.estoqueTotal)} em estoque (total)`}
            </p>
          </div>
        </div>
      </div>

      {aberta && (
        <div className="border-t border-indigo-50 px-4 pb-4">
          <div className="pt-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {f.membros.map((m) => <AnuncioCard key={m.sku} anuncio={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}
