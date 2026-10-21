import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader, ArrowRight } from 'lucide-react'

/**
 * Etapa 1 — e-mail + senha. Componente de apresentação puro:
 * recebe `onSubmit({ email, password })`, `submitting`. Não conhece auth.
 */
export default function LoginEmailPasswordForm({ onSubmit, submitting, submitLabel = 'Continuar' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ email: email.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="sr-only">E-mail</span>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full pl-9 pr-3 py-3 text-sm text-white placeholder:text-neutral-500 bg-white/5 border border-white/10 rounded-lg transition-colors focus:outline-none focus:border-[#0086FF] focus:ring-2 focus:ring-[#0086FF]/40 disabled:opacity-60"
          />
        </div>
      </label>

      <label className="block">
        <span className="sr-only">Senha</span>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full pl-9 pr-10 py-3 text-sm text-white placeholder:text-neutral-500 bg-white/5 border border-white/10 rounded-lg transition-colors focus:outline-none focus:border-[#0086FF] focus:ring-2 focus:ring-[#0086FF]/40 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0086FF] hover:bg-[#1a93ff] active:bg-[#0067C5] text-white font-bold text-sm rounded-lg transition-all shadow-[0_0_28px_-6px_rgba(0,134,255,0.55)] hover:shadow-[0_0_34px_-4px_rgba(0,134,255,0.7)] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {submitting ? (
          <>
            <Loader size={16} className="animate-spin" />
            Verificando…
          </>
        ) : (
          <>
            {submitLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
