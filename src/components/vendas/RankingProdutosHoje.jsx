import { Trophy } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { brl, inteiro } from '../magalu/formatos'

/** Ranking dos produtos vendidos hoje por receita. Só props. */
export default function RankingProdutosHoje({ linhas, semSku, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Produtos de hoje</h2>
      <p className="text-xs text-slate-400 mb-3">Por receita dos itens, só vendas (cancelados fora)</p>
      {!loading && linhas.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhum produto vendido hoje" />
      ) : (
        <ol className="space-y-2.5">
          {linhas.map((l, i) => (
            <li key={l.sku} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 truncate">{l.titulo ?? l.sku}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {`SKU ${l.sku} · ${inteiro(l.unidades)} un.`}
                  {l.itensSemQtd > 0 && ` · ${l.itensSemQtd} item(ns) sem quantidade`}
                  {l.itensSemValor > 0 && ` · ${l.itensSemValor} item(ns) sem valor`}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{brl(l.receita)}</span>
            </li>
          ))}
        </ol>
      )}
      {semSku > 0 && <p className="text-[11px] text-amber-700 mt-3">{`${semSku} item(ns) sem SKU legível ficaram fora do ranking`}</p>}
    </div>
  )
}
