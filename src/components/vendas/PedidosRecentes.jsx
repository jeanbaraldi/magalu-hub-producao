import { ReceiptText } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../magalu/StatusBadge'
import { brl } from '../magalu/formatos'

const hora = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
}

/** Lista dos pedidos mais recentes de hoje. Só props. */
export default function PedidosRecentes({ pedidos, total, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Pedidos recentes</h2>
      <p className="text-xs text-slate-400 mb-3">{loading ? 'Carregando…' : `${pedidos.length} de ${total} pedido(s) de hoje, incluindo cancelados`}</p>
      {!loading && pedidos.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Nenhum pedido hoje ainda" description="Os pedidos aparecem aqui assim que a sincronização os trouxer." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {pedidos.map((p) => (
            <li key={p.id} className="py-2.5 flex items-center gap-3">
              <span className="text-xs text-slate-400 tabular-nums w-12 flex-shrink-0">{hora(p.compradoEm)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 truncate">{p.titulo ?? 'Item não identificado no pedido'}</p>
                <p className="text-[11px] text-slate-400 truncate">{`Pedido ${p.id}`}</p>
              </div>
              <StatusBadge label={p.statusInfo.label} tone={p.statusInfo.tone} />
              <span className={`text-sm font-semibold tabular-nums w-24 text-right ${p.cancelado ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{brl(p.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
