import { useEffect, useState } from 'react'
import { ReceiptText } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../magalu/StatusBadge'
import { brl, dataHora } from '../magalu/formatos'

export default function PedidosTable({ rows, loading, pageSize = 50 }) {
  const [pagina, setPagina] = useState(0)
  const paginas = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { if (pagina >= paginas) setPagina(0) }, [pagina, paginas])

  if (loading && rows.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando pedidos…</div>
  }
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <EmptyState icon={ReceiptText} title="Nenhum pedido no período" description="Se a loja acabou de ser conectada, rode a sincronização em Configurações." />
      </div>
    )
  }

  const visiveis = rows.slice(pagina * pageSize, (pagina + 1) * pageSize)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Pedido</th>
              <th className="text-left font-semibold px-4 py-2.5">Produto</th>
              <th className="text-left font-semibold px-4 py-2.5">Data</th>
              <th className="text-left font-semibold px-4 py-2.5">Status</th>
              <th className="text-right font-semibold px-4 py-2.5">Itens</th>
              <th className="text-right font-semibold px-4 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-700" title={r.id}>{r.codigo ?? r.id}</td>
                <td className="px-4 py-2.5 max-w-xs">
                  <p className="truncate text-slate-800">{r.primeiroItem?.titulo ?? '—'}</p>
                  {r.primeiroItem?.sku && <p className="text-[11px] text-slate-400 font-mono">{r.primeiroItem.sku}</p>}
                </td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{dataHora(r.compradoEm)}</td>
                <td className="px-4 py-2.5"><StatusBadge {...r.statusInfo} /></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{r.itens ?? '—'}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">{brl(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginas > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
          <span>{`Página ${pagina + 1} de ${paginas} · ${rows.length} pedidos`}</span>
          <div className="flex gap-2">
            <button type="button" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40">Anterior</button>
            <button type="button" disabled={pagina >= paginas - 1} onClick={() => setPagina((p) => p + 1)} className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40">Próxima</button>
          </div>
        </div>
      )}
    </div>
  )
}
