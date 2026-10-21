import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PageHeader({ title, subtitle, backTo, breadcrumbs, actions, action, children, wrapActions = false }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
          <ol className="flex items-center gap-1.5">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight aria-hidden="true" size={10} className="flex-shrink-0" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-slate-600 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className={`flex items-start justify-between gap-4 ${wrapActions ? 'flex-wrap' : ''}`}>
        <div className="flex items-start gap-3 min-w-0">
          {backTo && (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              aria-label="Voltar"
              className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
          )}
          <div className="min-w-0">
            {children || (
              <>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
              </>
            )}
          </div>
        </div>
        {(actions || action) && <div className={`flex flex-wrap items-center gap-2 flex-shrink-0 ${wrapActions ? 'max-w-full' : ''}`}>{actions ?? action}</div>}
      </div>
    </div>
  )
}
