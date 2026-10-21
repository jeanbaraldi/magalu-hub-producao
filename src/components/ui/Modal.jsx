import { createContext, useContext, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const ModalContext = createContext(null)

export default function Modal({
  open,
  onClose,
  size = 'md',
  children,
  className,
  side = false,
  overlayClassName,
}) {
  const titleId = useId()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement

    const focusable = dialog.querySelectorAll(FOCUSABLE_SELECTOR)
    if (focusable.length > 0) focusable[0].focus()
    else dialog.focus()

    const handleKeyDown = (e) => {
      // Apenas o modal superior trata teclado (ex.: confirmar preço sobre análise).
      const dialogs = document.querySelectorAll('[aria-modal="true"]')
      if (dialogs[dialogs.length - 1] !== dialog) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement) {
        try { previouslyFocused.focus() } catch (_) { /* element may be gone */ }
      }
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <ModalContext.Provider value={{ titleId }}>
      <div className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex', side ? 'items-stretch justify-end' : 'items-center justify-center p-4', overlayClassName)}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            'bg-white rounded-2xl shadow-2xl w-full animate-fade-in max-h-[90vh] flex flex-col overscroll-contain focus:outline-none',
            modalSizes[size],
            side && 'rounded-none h-dvh max-h-dvh',
            className
          )}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  )
}

function ModalHeader({ icon: Icon, iconBg, iconColor, title, subtitle, onClose }) {
  const ctx = useContext(ModalContext)
  return (
    <div className="p-6 border-b border-slate-100 flex items-center gap-4 flex-shrink-0">
      {Icon && (
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg ?? 'bg-mg-blue')}>
          <Icon aria-hidden="true" size={20} className={iconColor ?? 'text-slate-900'} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 id={ctx?.titleId} className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-label="Fechar"
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  )
}

function ModalBody({ className, children }) {
  return (
    <div className={cn('p-6 overflow-y-auto overscroll-contain flex-1', className)}>
      {children}
    </div>
  )
}

function ModalFooter({ className, children }) {
  return (
    <div className={cn('p-6 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0', className)}>
      {children}
    </div>
  )
}

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
