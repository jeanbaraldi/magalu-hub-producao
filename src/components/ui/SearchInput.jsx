import { useId } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function SearchInput({
  id,
  value,
  onChange,
  placeholder = 'Buscar…',
  label,
  size = 'md',
  className,
  ...props
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const sizeCls = size === 'sm' ? 'h-8 text-xs pl-8 pr-3' : 'h-10 text-sm pl-10 pr-3'
  const iconSize = size === 'sm' ? 13 : 15
  const iconPos = size === 'sm' ? 'left-2.5' : 'left-3'

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      )}
      <Search
        aria-hidden="true"
        size={iconSize}
        className={cn('absolute top-1/2 -translate-y-1/2 text-slate-400', iconPos)}
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          'w-full border border-border-subtle rounded-xl bg-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue focus-visible:border-transparent',
          'placeholder:text-slate-400',
          sizeCls,
        )}
        {...props}
      />
    </div>
  )
}
