import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { verificarAcessoHub } from '../lib/acessoHub'
import { EMBUTIDO, pedirSaidaAoHub } from '../lib/embedHub'
import { SemAcessoHub } from '../components/SemAcessoHub'
import { isEmailAllowed } from '../features/auth/auth.constants'

// E-mails permitidos — lista em auth.constants.js (`ALLOWED_EMAILS`),
// configurável via VITE_ALLOWED_EMAILS (CSV). Comparação case-insensitive.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = carregando | null = deslogado | object = sessão ativa
  const [session, setSession] = useState(undefined)
  const [user, setUser] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)
  // Suíte: o Hub decide se esta pessoa entra no Gestor Magalu.
  const [acesso, setAcesso] = useState('verificando')
  const conferirAcesso = useCallback(async () => {
    setAcesso('verificando')
    setAcesso(await verificarAcessoHub(supabase))
  }, [])
  useEffect(() => {
    if (user) conferirAcesso()
  }, [user?.id, conferirAcesso]) // id, não o objeto: renovar token não refaz a checagem

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => handleSessionChange(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSessionChange(session) {
    if (session) {
      const email = (session.user?.email ?? '').toLowerCase()

      if (!isEmailAllowed(email)) {
        setAccessDenied(true)
        setSession(null)
        setUser(null)
        // No Hub, recusar aqui não pode derrubar a sessão do Hub: limpa só esta aba.
        await supabase.auth.signOut(EMBUTIDO ? { scope: 'local' } : undefined)
        return
      }

      setAccessDenied(false)
      setSession(session)
      setUser(session.user)
    } else {
      setSession(null)
      setUser(null)
    }
  }

  /**
   * Login por e-mail + senha. Cria a sessão imediatamente; o gate de e-mail
   * permitido roda no onAuthStateChange (handleSessionChange).
   */
  async function signInWithEmail(email, password) {
    setAccessDenied(false)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (EMBUTIDO) {
      // Aberto no Hub: quem encerra a sessão é o Hub, que depois revoga esta aba.
      if (pedirSaidaAoHub()) return
      await supabase.auth.signOut({ scope: 'local' })
      return
    }
    await supabase.auth.signOut()
  }

  const loading = session === undefined

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      accessDenied,
      signInWithEmail,
      signOut,
    }}>
      {user && acesso !== 'liberado'
        ? <SemAcessoHub estado={acesso} onTentarDeNovo={conferirAcesso} onSair={() => { void signOut() }} />
        : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
