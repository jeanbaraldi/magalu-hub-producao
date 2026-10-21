import { cn } from '../../lib/utils'

/**
 * @param {object} props
 * @param {React.ComponentType<{size?: number, className?: string}>} props.icon — lucide icon
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action] — botão/link CTA
 * @param {'default'|'positive'} [props.tone='default']
 */
export default function EmptyState({ icon: Icon, title, description, action, tone = 'default', className }) {
  const iconCls = tone === 'positive' ? 'text-status-success' : 'text-slate-300'
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 px-4', className)}>
      {Icon && <Icon aria-hidden="true" size={36} className={cn('mb-3', iconCls)} />}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
