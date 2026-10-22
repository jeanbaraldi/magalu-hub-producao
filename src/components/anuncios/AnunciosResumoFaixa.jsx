import { BarChart3, Box, ShoppingBag, Tag } from 'lucide-react'
import { brl, inteiro } from '../magalu/formatos'

/** Barra de resumo no topo, igual à do Gestor ML. Só props. */
export default function AnunciosResumoFaixa({ resumo }) {
  const sep = <div className="w-px h-4 bg-slate-200 hidden sm:block" />
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Tag aria-hidden="true" size={12} />
        <span className="font-semibold text-slate-700">{inteiro(resumo.total)}</span> anúncios
      </div>
      {sep}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Box aria-hidden="true" size={12} />
        <span className="font-semibold text-slate-700">{inteiro(resumo.estoqueTotal)}</span> em estoque
        {resumo.estoqueDesconhecido > 0 && <span className="text-slate-400">{`(${inteiro(resumo.estoqueDesconhecido)} sem informação)`}</span>}
      </div>
      {sep}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <BarChart3 aria-hidden="true" size={12} />
        Preço médio <span className="font-semibold text-slate-700">{brl(resumo.precoMedio)}</span>
      </div>
      {sep}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <ShoppingBag aria-hidden="true" size={12} />
        <span className="font-semibold text-slate-700">{inteiro(resumo.vendidos30)}</span> vendidos (30d)
      </div>
    </div>
  )
}
