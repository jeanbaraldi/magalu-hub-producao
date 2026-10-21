// Retorno do login do ID Magalu numa aba aberta pelo painel que roda dentro do Hub.
// A aba nova não tem a sessão do Hub (ela só existe em memória no iframe), então em
// vez de pedir login de novo ela devolve o `code` ao painel que a abriu e se fecha.
export const MSG_CODIGO_OAUTH = 'magalu-codigo-oauth'

/** Aba de mesma origem que abriu esta (null se não houver ou se for de outro site). */
export function abaDeOrigem(win) {
  try {
    const opener = win.opener
    if (!opener || opener.closed || opener === win) return null
    return opener.location.origin === win.location.origin ? opener : null
  } catch {
    return null // outro site: o navegador nega acesso
  }
}

/**
 * Se esta página é o retorno do ID Magalu numa aba aberta pelo painel, repassa o code
 * e fecha. Devolve true quando repassou (o app não precisa montar).
 */
export function repassarCodigoAoPainel(win) {
  const code = new URLSearchParams(win.location.search).get('code')
  if (!code) return false
  const painel = abaDeOrigem(win)
  if (!painel) return false
  painel.postMessage({ type: MSG_CODIGO_OAUTH, code }, win.location.origin)
  win.history.replaceState({}, '', win.location.pathname)
  win.document.body.innerHTML = '<p style="font:16px system-ui;padding:32px;color:#334155">Loja autorizada. Volte para o painel no Hub; esta aba vai fechar.</p>'
  setTimeout(() => win.close(), 800)
  return true
}
