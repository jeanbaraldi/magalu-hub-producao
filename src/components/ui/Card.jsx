import { cn } from '../../lib/utils'

const toneClasses = {
  default: 'bg-surface-card border border-border-subtle shadow-card',
  dark: 'bg-sidebar-bg text-white border border-sidebar-surface shadow-elevated',
  gradient: 'bg-gradient-to-br from-sidebar-bg via-sidebar-surface to-sidebar-bg text-white shadow-elevated',
  yellow: 'bg-mg-blue border border-mg-blue-dark text-white shadow-card',
}

export default function Card({ tone = 'default', className, children, ...props }) {
  return (
    <div className={cn('rounded-2xl', toneClasses[tone], className)} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ className, children }) {
  return (
    <div className={cn('px-5 pt-5 pb-3 flex items-start justify-between gap-3', className)}>
      {children}
    </div>
  )
}

function CardBody({ className, children }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}

function CardFooter({ className, children }) {
  return (
    <div className={cn('px-5 py-3 border-t border-border-subtle/60 flex items-center justify-between gap-3', className)}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
