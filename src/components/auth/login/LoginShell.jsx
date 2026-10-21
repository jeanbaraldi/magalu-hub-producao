import { useEffect, useRef } from 'react'
import { ShoppingCart } from 'lucide-react'
import './login.css'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * Moldura visual do login — "midnight terminal" (ref. Krea) com o amarelo do
 * Magalu como único acento. Fundo animado em CSS puro; o ponteiro só
 * grava variáveis CSS no elemento raiz (sem estado, sem re-render).
 * Reutilizável por qualquer etapa. Conteúdo via children.
 */
export default function LoginShell({ title, subtitle, children, footer }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia(REDUCED_MOTION).matches) return undefined

    function onMove(e) {
      const { innerWidth: w, innerHeight: h } = window
      root.style.setProperty('--mx', `${e.clientX}px`)
      root.style.setProperty('--my', `${e.clientY}px`)
      root.style.setProperty('--nx', ((e.clientX / w) * 2 - 1).toFixed(3))
      root.style.setProperty('--ny', ((e.clientY / h) * 2 - 1).toFixed(3))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div ref={rootRef} className="login-root flex items-center justify-center p-4 sm:p-8">
      <div className="login-orbs" aria-hidden="true">
        <div className="login-orb login-orb--a" />
        <div className="login-orb login-orb--b" />
      </div>
      <div className="login-floor" aria-hidden="true" />
      <div className="login-spot" aria-hidden="true" />
      <div className="login-vignette" aria-hidden="true" />

      <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_420px] lg:gap-20">
        {/* Lado editorial — só desktop */}
        <div className="login-copy hidden lg:block">
          <Brand />
          <h2 className="mt-10 text-[72px] font-bold leading-[1.02] tracking-[-0.025em] text-white">
            Cada venda,
            <br />
            <span className="text-[#0086FF]">sob controle.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-400">
            Pedidos, anúncios e faturamento de todas as suas lojas na Magalu num painel só.
          </p>
        </div>

        <div className="login-stage w-full">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="login-card p-8">
            <h1 className="mb-1 text-2xl font-bold tracking-[-0.015em] text-white">{title}</h1>
            {subtitle && <p className="mb-6 text-sm text-neutral-400">{subtitle}</p>}
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-neutral-500">
            {footer ?? 'Acesso restrito a membros autorizados'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0086FF] shadow-[0_0_30px_-4px_rgba(0,134,255,0.6)]">
        <ShoppingCart size={22} className="text-white" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-lg font-bold leading-none text-white">Gestor Magalu</p>
        <p className="text-sm text-neutral-400">Magazine Luiza</p>
      </div>
    </div>
  )
}
