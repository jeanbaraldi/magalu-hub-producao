import { Package } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import VariacaoBadge from '../relatorios/VariacaoBadge'

const n1 = (v) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v))

/** Projeção por SKU. Só props. */
export default function PrevisaoSkuTable({ linhas, horizonte, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Por SKU</h2>
      <p className="text-xs text-slate-400 mb-3">Nível do próprio SKU com a sazonalidade semanal da loja (mais estável que a de um SKU sozinho)</p>
      {!loading && linhas.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum SKU com venda nos últimos 90 dias" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3 font-medium">Produto</th>
                <th className="py-2 pr-3 font-medium text-right">Vendido (90d)</th>
                <th className="py-2 pr-3 font-medium text-right">Unid./dia</th>
                <th className="py-2 pr-3 font-medium text-right">{`Projeção ${horizonte}d`}</th>
                <th className="py-2 font-medium text-right">Tendência 7d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map((l) => (
                <tr key={l.sku}>
                  <td className="py-2 pr-3 min-w-[200px]">
                    <p className="text-slate-800 truncate max-w-xs">{l.titulo ?? l.sku}</p>
                    <p className="text-[11px] text-slate-400">
                      {`SKU ${l.sku}`}
                      {l.itensSemQtd > 0 && ` · ${l.itensSemQtd} item(ns) sem quantidade (fora da conta)`}
                    </p>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{n1(l.unidades90)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{n1(l.porDia)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-semibold text-slate-900">{n1(l.projecao)}</td>
                  <td className="py-2 text-right"><VariacaoBadge valor={l.tendencia} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
