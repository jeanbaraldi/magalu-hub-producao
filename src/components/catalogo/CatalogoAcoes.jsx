// Botões do cabeçalho: puxar custos da Precificação e sincronizar o catálogo com a Magalu.
import { Download, Loader, RefreshCw } from 'lucide-react'

export default function CatalogoAcoes({ podeVerValores, puxandoCustos, sincronizando, onPuxarCustos, onSincronizar }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {podeVerValores && (
        <button type="button" onClick={onPuxarCustos} disabled={puxandoCustos}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60">
          {puxandoCustos ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
          Puxar custos da Precificação
        </button>
      )}
      <button type="button" onClick={onSincronizar} disabled={sincronizando}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-mg-blue hover:bg-mg-blue-dark rounded-xl transition-colors disabled:opacity-60">
        {sincronizando ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Sincronizar com a Magalu
      </button>
    </div>
  )
}
