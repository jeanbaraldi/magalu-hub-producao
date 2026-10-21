import { useState } from 'react'
import { Package } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { brl, inteiro } from '../magalu/formatos'
import CustoInput from './CustoInput'

const pct = (v) => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')}%`)
const mult = (v) => (v == null ? '—' : `${v.toFixed(2).replace('.', ',')}×`)

export default function ProdutosTable({ rows, loading, pageSize, podeVerValores, onSalvarCusto }) {
  const [limite, setLimite] = useState(pageSize)

  if (loading && rows.length === 0) {
    return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando catálogo…</div>
  }
  if (rows.length === 0) {
    return <div className="bg-white rounded-2xl border border-slate-200"><EmptyState icon={Package} title="Nenhum SKU encontrado" description="Ajuste o filtro ou sincronize o catálogo em Configurações." /></div>
  }

  const visiveis = rows.slice(0, limite)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Produto</th>
              <th className="text-right px-4 py-3 font-semibold">Preço</th>
              {podeVerValores && <th className="text-left px-4 py-3 font-semibold">Custo</th>}
              {podeVerValores && <th className="text-right px-4 py-3 font-semibold">Markup</th>}
              {podeVerValores && <th className="text-right px-4 py-3 font-semibold">Margem bruta/un.</th>}
              <th className="text-right px-4 py-3 font-semibold">Vendas 30d</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((r) => (
              <tr key={r.sku} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-[220px]">
                    {r.imagem
                      ? <img src={r.imagem} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 line-clamp-2">{r.titulo ?? 'Sem título'}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{brl(r.preco)}</td>
                {podeVerValores && (
                  <td className="px-4 py-3"><CustoInput sku={r.sku} custo={r.custo} onSalvar={onSalvarCusto} /></td>
                )}
                {podeVerValores && <td className="px-4 py-3 text-right whitespace-nowrap">{mult(r.markup)}</td>}
                {podeVerValores && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={r.margemUnit == null ? 'text-slate-400' : r.margemUnit < 0 ? 'text-rose-600 font-semibold' : 'text-slate-800'}>{brl(r.margemUnit)}</span>
                    <span className="block text-xs text-slate-400">{pct(r.margemPct)}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {inteiro(r.vendas30)}
                  {r.vendasParcial && <span className="block text-[11px] text-amber-600" title="Há item de pedido sem quantidade informada">parcial</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limite && (
        <div className="p-3 border-t border-slate-100 text-center">
          <button type="button" onClick={() => setLimite((l) => l + pageSize)} className="text-sm font-semibold text-mg-blue hover:underline">
            Mostrar mais ({rows.length - limite} restantes)
          </button>
        </div>
      )}
    </div>
  )
}
