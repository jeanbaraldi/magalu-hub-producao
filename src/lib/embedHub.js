// Suíte: receptor do protocolo hn-hub-embed-v1. Quando o Hub abre esta ferramenta
// numa aba (iframe com ?hub_embed=1), a sessão vem do Hub por postMessage e fica só
// em memória. Só o Hub renova e encerra a sessão; aqui nunca se renova token.
// Fora do iframe nada disto roda: login normal (inclusive Google PKCE) e sessão persistida.
import { SISTEMA_NO_HUB } from './acessoHub'

export const PROTOCOL = 'hn-hub-embed-v1'
const UUID = /^[a-f0-9-]{36}$/
/** Token que vence antes disso é recusado: aceitá-lo faria o SDK tentar renovar aqui. */
const MARGEM_EXPIRACAO_MS = 30_000

/** VITE_HUB_ORIGIN: origem exata do Hub (https://hub.empresa.com.br). Outro formato = sem embutido. */
export function origemDoHub(raw) {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && !url.username && !url.password && raw.replace(/\/$/, '') === url.origin
      ? url.origin
      : null
  } catch {
    return null
  }
}

export function modoEmbutido(win) {
  if (win.parent === win) return false
  const naUrl = new URLSearchParams(win.location.search).get('hub_embed') === '1'
  // Recarregar a página dentro da aba perde o ?hub_embed=1; a marca fica na sessão da aba.
  try {
    if (naUrl) win.sessionStorage?.setItem('hub_embed', '1')
    return naUrl || win.sessionStorage?.getItem('hub_embed') === '1'
  } catch {
    return naUrl
  }
}

/**
 * fetch do cliente embutido: renovar token, login por senha e logout no servidor
 * ficam com o Hub. O logout "local" do SDK também chama o servidor, e isso
 * derrubaria a sessão compartilhada do Hub. Resposta 401 local, sem rede.
 */
export function fetchEmbutido(supabaseUrl) {
  const origem = new URL(supabaseUrl).origin
  return (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.origin === origem && (url.pathname === '/auth/v1/token' || url.pathname === '/auth/v1/logout')) {
      return Promise.resolve(new Response(JSON.stringify({ code: 'hub_embed', msg: 'Sessão gerida pelo Hub' }), {
        status: 401, headers: { 'content-type': 'application/json' },
      }))
    }
    return fetch(input, init)
  }
}

function expiraEmMs(accessToken) {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const exp = JSON.parse(atob(payload)).exp
    return typeof exp === 'number' ? exp * 1000 : 0
  } catch {
    return 0
  }
}

export function iniciarReceptorHub({ auth, app, hubOrigin, win }) {
  const nonce = crypto.randomUUID() // um por documento
  let challenge = null
  let ultimaRevisao = -1
  let fila = Promise.resolve()

  const enviar = (type, extra = {}) => {
    if (challenge) win.parent.postMessage({ protocol: PROTOCOL, app, type, nonce, challenge, ...extra }, hubOrigin)
  }

  const onMessage = (event) => {
    if (event.origin !== hubOrigin || event.source !== win.parent) return
    const d = event.data
    if (!d || d.protocol !== PROTOCOL || typeof d.challenge !== 'string' || !UUID.test(d.challenge)) return
    if (d.type === 'probe') {
      if (d.app !== app) return
      if (d.challenge !== challenge) { challenge = d.challenge; ultimaRevisao = -1 }
      enviar('ready')
      return
    }
    if (d.nonce !== nonce || d.challenge !== challenge || !Number.isInteger(d.revision) || d.revision <= ultimaRevisao) return
    ultimaRevisao = d.revision
    const esperado = challenge
    if (d.type === 'session') {
      const { revision, access_token, refresh_token } = d
      if (typeof access_token !== 'string' || typeof refresh_token !== 'string') return
      fila = fila.then(async () => {
        if (expiraEmMs(access_token) < Date.now() + MARGEM_EXPIRACAO_MS) throw new Error('token perto de vencer')
        const { error } = await auth.setSession({ access_token, refresh_token })
        if (error) throw error
        if (challenge === esperado) enviar('authenticated', { revision })
      }).catch(() => { if (challenge === esperado) enviar('error') })
    } else if (d.type === 'revoke') {
      fila = fila.then(() => auth.signOut({ scope: 'local' })).catch(() => {})
    }
  }

  win.addEventListener('message', onMessage)
  return {
    /** Sair dentro do Hub: pede ao Hub. false = ainda sem canal com o Hub. */
    pedirSaida: () => { if (!challenge) return false; enviar('logout'); return true },
    parar: () => win.removeEventListener('message', onMessage),
  }
}

export const HUB_ORIGIN = origemDoHub(import.meta.env.VITE_HUB_ORIGIN)
export const EMBUTIDO = typeof window !== 'undefined' && modoEmbutido(window)
let receptor = null

export function ligarReceptorHub(auth) {
  if (EMBUTIDO && HUB_ORIGIN && !receptor) receptor = iniciarReceptorHub({ auth, app: SISTEMA_NO_HUB, hubOrigin: HUB_ORIGIN, win: window })
}

export function pedirSaidaAoHub() {
  return receptor?.pedirSaida() ?? false
}
