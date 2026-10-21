import { useState } from 'react'
import { ChevronDown, ImageOff, Layers } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import AnuncioCard from './AnuncioCard'
import { brl, inteiro } from '../magalu/formatos'

/** Família de variações (mesmo group.id na Magalu): resumo + variações abríveis. Só props. */
export default function FamiliaCard({ familia: f }) {
  const [aberta, setAberta] = useState(false)
  const faixa = f.precoMin == null ? '—'
    : f.precoMin === f.precoMax ? brl(f.precoMin) : `${brl(f.precoMin)} – ${brl(f.precoMax)}`
  return (
    <div className="bg-white rounded-2xl border border-violet-200 p-4 md:col-span-2 xl:col-span-3">
      <button type="button" onClick={() => setAberta((v) => !v)} aria-expanded={aberta} className="w-full flex items-center gap-3 text-left">
        <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {f.pai.imagem ? <img src={f.pai.imagem} alt="" loading="lazy" className="w-full h-full object-contain" /> : <ImageOff aria-hidden="true" size={18} className="text-slate-300" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{f.pai.titulo ?? f.pai.sku}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <StatusBadge label={`${f.membros.length} variações`} tone="violet" />
            {f.pai.marca && <span className="text-[11px] text-slate-500 bg-slate-100 rounded px-1.5">{f.pai.marca}</span>}
          </div>
        </div>
        <div className="hidden sm:grid grid-cols-3 gap-6 text-right">
          <div><p className="text-sm font-bold tabular-nums text-slate-900">{faixa}</p><p className="text-[11px] text-slate-400">preço</p></div>
          <div><p className="text-sm font-bold tabular-nums text-slate-900">{inteiro(f.vendidos30)}</p><p className="text-[11px] text-slate-400">vendidos (30d)</p></div>
          <div>
            <p className="text-sm font-bold tabular-nums text-slate-900">{inteiro(f.estoqueTotal)}</p>
            <p className="text-[11px] text-slate-400">{f.estoqueDesconhecido > 0 ? `${f.estoqueDesconhecido} sem estoque informado` : 'em estoque'}</p>
          </div>
        </div>
        <ChevronDown aria-hidden="true" size={18} className={`text-slate-400 transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          {f.membros.map((m) => <AnuncioCard key={m.sku} anuncio={m} />)}
        </div>
      )}
      {!aberta && (
        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1"><Layers aria-hidden="true" size={11} />Clique para ver as variações com preço, estoque e margem de cada uma</p>
      )}
    </div>
  )
}
