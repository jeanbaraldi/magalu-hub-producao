// Avisos comuns das telas Anúncios e Produtos (erro, vendas indisponíveis, resultado das
// ações). Componente burro.
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CatalogoAvisos({ error, avisoVendas, aviso }) {
  return (
    <>
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {`Erro ao carregar o catálogo: ${error}`}
        </div>
      )}
      {avisoVendas && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertCircle size={14} className="flex-shrink-0" />
          {avisoVendas}
        </div>
      )}
      {aviso && (
        <div role="status" className={`flex items-center gap-3 p-3 rounded-xl text-xs border ${aviso.tom === 'erro' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {aviso.tom === 'erro' ? <AlertCircle size={14} className="flex-shrink-0" /> : <CheckCircle2 size={14} className="flex-shrink-0" />}
          {aviso.texto}
        </div>
      )}
    </>
  )
}
