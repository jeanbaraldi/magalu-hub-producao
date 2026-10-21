import { Package } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import VariacaoBadge from './VariacaoBadge'
import { brl, inteiro } from '../magalu/formatos'

/** Top SKUs por receita no período atual, com a variação sobre o anterior. Só props. */
export default function TopSkusTable({ linhas, semSku, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 break-inside-avoid">
      <h2 className="text-sm font-bold text-slate-900">Top 10 SKUs por receita</h2>
      <p className="text-xs text-slate-400 mb-3">Receita dos itens no período atual, só vendas</p>
      {!loading && linhas.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum item vendido no período" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Produto</th>
                <th className="py-2 pr-3 font-medium text-right">Unidades</th>
                <th className="py-2 pr-3 font-medium text-right">Receita</th>
                <th className="py-2 pr-3 font-medium text-right">Anterior</th>
                <th className="py-2 font-medium text-right">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map((l, i) => (
                <tr key={l.sku}>
                  <td className="py-2 pr-3 text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-3 min-w-[200px]">
                    <p className="text-slate-800 truncate max-w-xs">{l.titulo ?? l.sku}</p>
                    <p className="text-[11px] text-slate-400">
                      {`SKU ${l.sku}`}
                      {l.itensSemValor > 0 && ` · ${l.itensSemValor} item(ns) sem valor`}
                      {l.itensSemQtd > 0 && ` · ${l.itensSemQtd} item(ns) sem quantidade`}
                    </p>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{inteiro(l.unidades)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-semibold text-slate-900">{brl(l.receita)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-500">{brl(l.receitaAnterior)}</td>
                  <td className="py-2 text-right"><VariacaoBadge valor={l.variacao} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {semSku > 0 && <p className="text-[11px] text-amber-700 mt-3">{`${semSku} item(ns) sem SKU legível ficaram fora da tabela`}</p>}
    </div>
  )
}
