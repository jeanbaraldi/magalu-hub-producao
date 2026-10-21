import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { MAGALU_AUTH_URL, MAGALU_ESCOPOS_PADRAO } from '../features/magalu/magalu.constants'

const AppContext = createContext(null)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const MAGALU_CLIENT_ID = import.meta.env.VITE_MAGALU_CLIENT_ID

/**
 * Redirect do OAuth da Magalu. Default = origem atual; override por
 * `VITE_MAGALU_REDIRECT_URI`. Precisa bater BYTE A BYTE com o cadastrado no app
 * (ID Magalu). String vazia conta como ausente: o Vite embute `''` e `??` não
 * cairia no fallback (mesmo defeito que o Gestor ML já teve).
 */
function resolveRedirectUri() {
  const configurado = (import.meta.env.VITE_MAGALU_REDIRECT_URI ?? '').trim()
  return configurado || window.location.origin
}
const MAGALU_REDIRECT_URI = resolveRedirectUri()

/** Escopos pedidos na autorização. Configurável sem código novo. */
const MAGALU_ESCOPOS = (import.meta.env.VITE_MAGALU_SCOPES ?? '').trim() || MAGALU_ESCOPOS_PADRAO

const ACTIVE_ACCOUNT_KEY = 'magalu_active_account_id'

async function callEdgeFunction(fnName, params = {}, options = {}, accessToken = null) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${SUPABASE_URL}/functions/v1/${fnName}${queryString ? '?' + queryString : ''}`
  return fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      // Token do USUÁRIO logado: o magalu-oauth recusa chamada só com a anon key.
      Authorization: `Bearer ${accessToken ?? SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

/** Mesmo formato do Gestor ML: `id` é a conta (tenant/loja da Magalu). */
const idDaConta = (c) => String(c.id ?? c.account_id)

export function AppProvider({ children }) {
  const { session } = useAuth()

  // Lojas Magalu conectadas: [{ id, account_id, nickname, expires_at, needs_reconnect }]
  const [sellers, setSellers] = useState([])
  const [activeSellerId, setActiveSellerIdState] = useState(() => localStorage.getItem(ACTIVE_ACCOUNT_KEY))
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const didHandleCallback = useRef(false)

  const conta = sellers.find((s) => idDaConta(s) === activeSellerId) ?? sellers[0] ?? null
  const isConnected = sellers.length > 0

  const loadSellers = useCallback(async () => {
    setCheckingStatus(true)
    try {
      const res = await callEdgeFunction('magalu-oauth', { action: 'list_accounts' }, {}, session?.access_token)
      if (!res.ok) {
        setSellers([])
        if (res.status === 401) {
          const { error: authError } = await supabase.auth.getUser()
          if (authError) {
            setConnectionError('Sua sessão expirou ou foi encerrada em outro dispositivo. Entre novamente.')
            await supabase.auth.signOut({ scope: 'local' })
          } else {
            setConnectionError('Acesso negado pelo servidor. Confira se o seu e-mail está em ALLOWED_EMAILS nas Edge Functions.')
          }
        }
        // 403 = o Hub não libera nenhuma loja para esta pessoa. Dizer "nenhuma conta
        // conectada" mandaria conectar uma loja que já existe.
        if (res.status === 403) {
          const corpo = await res.json().catch(() => null)
          setConnectionError(corpo?.message || 'Nenhuma loja da Magalu está liberada para você no Hub.')
        }
        return []
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data.filter((s) => !s.error || s.needs_reconnect) : []
      setSellers(list)

      const atual = localStorage.getItem(ACTIVE_ACCOUNT_KEY)
      if (!list.some((s) => idDaConta(s) === atual) && list.length > 0) {
        const primeiro = idDaConta(list[0])
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, primeiro)
        setActiveSellerIdState(primeiro)
      } else if (list.length === 0) {
        localStorage.removeItem(ACTIVE_ACCOUNT_KEY)
        setActiveSellerIdState(null)
      }
      return list
    } catch {
      setSellers([])
      return []
    } finally {
      setCheckingStatus(false)
    }
  }, [session?.access_token])

  const selectSeller = useCallback((id) => {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(id))
    setActiveSellerIdState(String(id))
  }, [])

  /** Inicia o OAuth do ID Magalu para conectar mais uma loja. */
  async function addAccount() {
    // Suíte: sem VITE_MAGALU_CLIENT_ID no build, o Client ID vem do Hub (Conexões).
    let clientId = MAGALU_CLIENT_ID
    if (!clientId) {
      const { data, error } = await supabase.schema('hub').rpc('credencial_publica', { p_provedor: 'magalu', p_chave: 'client_id' })
      if (error || !data) {
        window.alert('Cadastre o Client ID da Magalu no Hub (Conexões) antes de conectar a loja.')
        return
      }
      clientId = data
    }
    const authUrl = new URL(MAGALU_AUTH_URL)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', MAGALU_REDIRECT_URI)
    authUrl.searchParams.set('scope', MAGALU_ESCOPOS)
    authUrl.searchParams.set('response_type', 'code')
    // Para seller é sempre true: é o que deixa a pessoa escolher QUAL loja autoriza.
    authUrl.searchParams.set('choose_tenants', 'true')
    window.location.href = authUrl.toString()
  }

  const removeAccount = useCallback(async (id) => {
    try {
      await callEdgeFunction('magalu-oauth', { action: 'disconnect', account_id: String(id) }, {}, session?.access_token)
    } catch {
      // recarrega mesmo assim
    }
    await loadSellers()
  }, [loadSellers, session?.access_token])

  async function handleOAuthCallback() {
    if (didHandleCallback.current) return
    didHandleCallback.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    // Leva para Configurações: é lá que o resultado (e o erro) da conexão aparece.
    window.location.hash = '#/configuracoes'
    setIsConnecting(true)
    setConnectionError(null)
    try {
      const res = await callEdgeFunction('magalu-oauth', { code, redirect_uri: MAGALU_REDIRECT_URI }, {}, session?.access_token)
      const data = await res.json()
      if (!res.ok) {
        const detalhe = typeof data?.details === 'string' ? data.details : data?.details ? JSON.stringify(data.details) : null
        throw new Error([data?.error ?? 'Falha na autenticação com a Magalu', detalhe].filter(Boolean).join(' — '))
      }
      if (data.account_id) {
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(data.account_id))
        setActiveSellerIdState(String(data.account_id))
      }
    } catch (err) {
      setConnectionError(err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  // Só depois de logado: a tela /login não pode listar lojas.
  useEffect(() => {
    if (!session) {
      setSellers([])
      setCheckingStatus(false)
      return
    }
    (async () => {
      await handleOAuthCallback()
      await loadSellers()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  return (
    <AppContext.Provider value={{
      sellers,
      activeSellerId,
      selectSeller,
      addAccount,
      removeAccount,
      loadSellers,
      conta,
      contaId: conta ? idDaConta(conta) : null,
      isConnected,
      isConnecting,
      connectionError,
      checkingStatus,
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
