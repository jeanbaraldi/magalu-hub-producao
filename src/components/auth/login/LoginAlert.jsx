import { AlertCircle } from 'lucide-react'

/**
 * Caixa de alerta de erro padronizada (vermelha) com detalhe técnico opcional.
 */
export default function LoginAlert({ title, message, detail }) {
  if (!message && !title) return null

  return (
    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-5">
      <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-red-300">{title}</p>}
        {message && (
          <p className={`text-red-300 ${title ? 'text-xs text-red-400 mt-0.5' : 'text-sm'}`}>
            {message}
          </p>
        )}
        {detail && detail !== message && (
          <details className="mt-2">
            <summary className="text-xs text-red-400 cursor-pointer hover:underline">
              Detalhes técnicos
            </summary>
            <p className="text-xs text-red-400 mt-1 font-mono break-words">{detail}</p>
          </details>
        )}
      </div>
    </div>
  )
}
