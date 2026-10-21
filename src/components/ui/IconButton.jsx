import { cn } from '../../lib/utils'

const variantClasses = {
  default: 'bg-white border border-border-subtle text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ghost: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
  yellow: 'bg-mg-blue text-white hover:bg-mg-blue-dark font-bold',
  dark: 'bg-sidebar-surface text-white hover:bg-sidebar-bg',
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

/**
 * Square button somente com ícone. Requer aria-label.
 * @param {object} props
 * @param {React.ComponentType<{size?: number}>} props.icon — lucide icon
 * @param {string} props['aria-label']
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {'default'|'ghost'|'yellow'|'dark'} [props.variant]
 */
export default function IconButton({ icon: Icon, size = 'md', variant = 'default', className, ...props }) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-900',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" size={iconSize} />
    </button>
  )
}
