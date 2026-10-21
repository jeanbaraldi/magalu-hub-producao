import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'

export default function AlertaGrupo({ grupo }) {
  if (grupo.itens.length === 0) return null
  return (
    <section aria-label={grupo.label} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <h2 className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-800">
        <StatusBadge label={grupo.label} tone={grupo.tone} />
        <span className="text-slate-400 font-semibold">{grupo.itens.length}</span>
      </h2>
      <ul className="divide-y divide-slate-100">
        {grupo.itens.map((i) => (
          <li key={i.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{i.titulo}</p>
              <p className="text-xs text-slate-500 mt-0.5 break-words">{i.detalhe}</p>
            </div>
            {i.link && (
              <Link to={i.link.to} className="inline-flex items-center gap-1 text-sm font-semibold text-mg-blue hover:underline whitespace-nowrap">
                {i.link.label} <ArrowRight aria-hidden="true" size={14} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
