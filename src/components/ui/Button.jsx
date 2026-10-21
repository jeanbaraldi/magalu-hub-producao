import { Loader } from 'lucide-react'
import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-mg-blue hover:bg-mg-blue-dark text-white font-bold',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium',
  ghost: 'text-slate-600 hover:bg-slate-100',
  dark: 'bg-slate-900 hover:bg-slate-800 text-white font-semibold',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  children,
  className,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-900',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader aria-hidden="true" size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : Icon ? (
        <Icon aria-hidden="true" size={size === 'sm' ? 12 : 14} />
      ) : null}
      {children}
    </button>
  )
}
