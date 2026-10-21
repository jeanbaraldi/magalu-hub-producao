import { useId } from 'react'
import { cn } from '../../lib/utils'

export default function Input({
  id,
  label,
  error,
  helper,
  className,
  type = 'text',
  ...props
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const isTextarea = type === 'textarea'
  const Component = isTextarea ? 'textarea' : 'input'

  const describedBy = [
    error ? errorId : null,
    helper && !error ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 mb-1.5">
          {label}
        </label>
      )}
      <Component
        id={inputId}
        type={isTextarea ? undefined : type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue focus-visible:border-transparent',
          'placeholder:text-slate-400',
          error && 'border-red-300 focus-visible:ring-red-400',
          isTextarea && 'resize-none',
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="mt-1 text-xs text-slate-400">
          {helper}
        </p>
      )}
    </div>
  )
}
