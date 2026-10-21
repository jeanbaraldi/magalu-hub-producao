import { Boxes, ShoppingBag, Tag, TrendingUp } from 'lucide-react'
import { brl, inteiro } from '../magalu/formatos'

/** Faixa de resumo no topo, como no Gestor ML. Só props. */
export default function AnunciosResumoFaixa({ resumo, loading }) {
  const v = (x) => (loading ? '…' : x)
  const itens = [
    { Icone: Tag, valor: inteiro(resumo.total), rotulo: 'anúncios' },
    { Icone: Boxes, valor: inteiro(resumo.estoqueTotal), rotulo: resumo.estoqueDesconhecido > 0 ? `em estoque (${resumo.estoqueDesconhecido} sem informação)` : 'em estoque' },
    { Icone: TrendingUp, valor: brl(resumo.precoMedio), rotulo: 'preço médio', antes: true },
    { Icone: ShoppingBag, valor: inteiro(resumo.vendidos30), rotulo: 'vendidos (30d)' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
      {itens.map(({ Icone, valor, rotulo, antes }) => (
        <span key={rotulo} className="inline-flex items-center gap-1.5 text-slate-500">
          <Icone aria-hidden="true" size={14} className="text-slate-400" />
          {antes ? <>{rotulo} <b className="text-slate-900 tabular-nums">{v(valor)}</b></> : <><b className="text-slate-900 tabular-nums">{v(valor)}</b> {rotulo}</>}
        </span>
      ))}
    </div>
  )
}
