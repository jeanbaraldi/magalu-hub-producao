import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mapLoginError } from '../features/auth/auth.constants'
import LoginShell from '../components/auth/login/LoginShell'
import LoginAlert from '../components/auth/login/LoginAlert'
import LoginEmailPasswordForm from '../components/auth/login/LoginEmailPasswordForm'

/**
 * Página de login por e-mail + senha. Página fina: a lógica de auth vem
 * do AuthContext; o formulário é apresentação pura.
 */
export default function Login() {
  const { signInWithEmail, accessDenied, session } = useAuth()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errorDetail, setErrorDetail] = useState(null)

  async function handleCredentials({ email, password }) {
    setError(null)
    setErrorDetail(null)
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('[Login] credentials error:', err)
      setError(mapLoginError(err?.message))
      setErrorDetail(err?.message || String(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Sessão que chega depois (ex.: entregue pelo Hub quando aberto numa aba dele).
  if (session) return <Navigate to="/dashboard" replace />

  return (
    <LoginShell
      title="Bem-vindo"
      subtitle="Acesse sua conta para gerenciar seus anúncios e produtos."
    >
      {accessDenied && (
        <LoginAlert
          title="Acesso não autorizado"
          message="Esta conta não tem permissão para acessar o Gestor Magalu."
        />
      )}
      {error && !accessDenied && <LoginAlert message={error} detail={errorDetail} />}

      <LoginEmailPasswordForm
        onSubmit={handleCredentials}
        submitting={submitting}
        submitLabel="Entrar"
      />
    </LoginShell>
  )
}
