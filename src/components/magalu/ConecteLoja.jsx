import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'

/** Estado vazio de tela que depende de loja conectada. */
export default function ConecteLoja({ titulo, descricao }) {
  return (
    <div className="p-8 max-w-md mx-auto text-center py-16">
      <Store aria-hidden="true" size={48} className="text-slate-200 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-slate-700 mb-2">{titulo ?? 'Conecte uma loja da Magalu'}</h2>
      <p className="text-slate-500 text-sm mb-6">{descricao ?? 'Autorize sua loja para ver pedidos, anúncios e faturamento.'}</p>
      <Link
        to="/configuracoes"
        className="inline-flex items-center gap-2 px-6 py-3 bg-mg-blue hover:bg-mg-blue-dark text-white font-bold text-sm rounded-xl transition-colors"
      >
        Ir para Configurações
      </Link>
    </div>
  )
}
