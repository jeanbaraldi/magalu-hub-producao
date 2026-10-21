import { RefreshCw, Loader, CheckCircle, AlertCircle, Clock, X, LogIn } from 'lucide-react'

const PHASE_LABELS = {
  connecting: 'Conectando ao Magalu…',
  fetching: 'Buscando anúncios…',
  saving: 'Salvando no banco de dados…',
  done: 'Sincronização concluída!',
  error: 'Erro na sincronização',
}

/**
 * Compact sync status bar with progress indicator.
 * Shows: sync button, progress bar during sync, result after sync, last sync time.
 *
 * @param {Object} props
 * @param {boolean} props.syncing
 * @param {number} props.progress - 0 to 100
 * @param {string} props.phase
 * @param {Object|null} props.result - { ok, total, synced, paused, closed, discontinued, error }
 * @param {string|null} props.lastSyncLabel - e.g. "há 5 min"
 * @param {Function} props.onSync
 * @param {Function} props.onDismiss
 * @param {Function} [props.onReconnect] - called when user clicks "Reconectar"
 * @param {boolean} [props.compact=false] - minimal mode (button only, no banner)
 */
export default function SyncStatusBar({
  syncing,
  progress,
  phase,
  result,
  lastSyncLabel,
  onSync,
  onDismiss,
  onReconnect,
  compact = false,
}) {
  return (
    <div className="space-y-2">
      {/* Sync button row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0086FF] hover:bg-[#0067C5] rounded-xl transition-colors disabled:opacity-60 shadow-sm"
        >
          {syncing ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {syncing ? 'Sincronizando…' : 'Sincronizar'}
        </button>

        {/* Last sync indicator */}
        {!syncing && lastSyncLabel && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={11} />
            Última sync: {lastSyncLabel}
          </span>
        )}
      </div>

      {/* Progress bar (during sync) */}
      {syncing && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Loader size={14} className="text-blue-500 animate-spin flex-shrink-0" />
            <span className="text-sm font-medium text-blue-700">
              {PHASE_LABELS[phase] || 'Sincronizando…'}
            </span>
            <span className="text-xs text-blue-400 ml-auto">{progress}%</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Result banner (after sync) */}
      {!syncing && result && !compact && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in ${
            result.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : result.tokenExpired
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {result.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span className="flex-1">
            {result.ok
              ? formatSyncResult(result)
              : result.tokenExpired
                ? 'Token do Magalu expirado. Reconecte sua conta para continuar.'
                : `Erro ao sincronizar: ${result.error}`}
          </span>
          {result.tokenExpired && onReconnect && (
            <button
              onClick={onReconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              <LogIn size={12} />
              Reconectar
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-0.5 hover:bg-black/5 rounded transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function formatSyncResult(r) {
  const parts = []
  if (r.synced > 0) parts.push(`${r.synced} ativos`)
  if (r.paused > 0) parts.push(`${r.paused} pausados`)
  if (r.closed > 0) parts.push(`${r.closed} encerrados`)

  let text = `${r.total} anúncios sincronizados`
  if (parts.length > 0) text += ` — ${parts.join(' • ')}`
  if (r.discontinued > 0) {
    text += ` (${r.discontinued} descontinuado${r.discontinued !== 1 ? 's' : ''})`
  }
  return text
}
