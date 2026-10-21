import { RefreshCw, Unplug, AlertTriangle } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import { dataHora } from '../magalu/formatos'

export default function LojaRow({ loja, ativa, sincronizando, onSincronizar, onDesconectar, onSelecionar }) {
  const id = String(loja.id ?? loja.account_id)
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-mg-blue/10 text-mg-blue flex items-center justify-center font-bold text-sm flex-shrink-0">
        {(loja.nickname ?? id).slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{loja.nickname ?? 'Loja sem nome'}</p>
          {ativa && <StatusBadge label="Ativa no painel" tone="blue" />}
          {loja.needs_reconnect && <StatusBadge label="Reconectar" tone="amber" />}
        </div>
        <p className="text-[11px] text-slate-400 font-mono truncate">{id}</p>
        <p className="text-[11px] text-slate-400">{`Token expira em ${dataHora(loja.expires_at)}`}</p>
      </div>
      <div className="flex items-center gap-2">
        {!ativa && (
          <button type="button" onClick={() => onSelecionar(id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Usar esta</button>
        )}
        <button type="button" disabled={sincronizando} onClick={() => onSincronizar(id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mg-blue text-white text-xs font-semibold hover:bg-mg-blue-dark disabled:opacity-50">
          <RefreshCw aria-hidden="true" size={12} className={sincronizando ? 'animate-spin' : ''} /> {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
        <button type="button" onClick={() => onDesconectar(loja)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50">
          <Unplug aria-hidden="true" size={12} /> Desconectar
        </button>
      </div>
      {loja.needs_reconnect && (
        <p className="w-full flex items-center gap-1.5 text-xs text-amber-700">
          <AlertTriangle aria-hidden="true" size={12} /> O token desta loja não renova mais. Conecte de novo para voltar a sincronizar.
        </p>
      )}
    </div>
  )
}
