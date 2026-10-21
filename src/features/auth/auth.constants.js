// ════════════════════════════════════════════════════════════════
// Constantes do fluxo de login por e-mail+senha
// ════════════════════════════════════════════════════════════════

/**
 * Lista de e-mails autorizados a acessar o Gestor Magalu.
 *
 * **Modelo single-tenant (distribuição self-host):**
 * Por padrão, a lista é vazia → sem gate (qualquer e-mail permitido);
 * recomenda-se configurar a própria conta no Supabase Auth e desabilitar
 * public signup (apenas o dono cria accounts). Se preciso restringir, use
 * `VITE_ALLOWED_EMAILS` no .env.local / Vercel (CSV).
 *
 * O gate é fonte de verdade no front (AuthContext) e espelhado nas edge
 * functions (`magalu-oauth`, `magalu-proxy`, `magalu-sync`) via env `ALLOWED_EMAILS`.
 *
 * Pode ser sobrescrito via `VITE_ALLOWED_EMAILS` no .env.local / Vercel
 * (CSV — separador `,`). Mantém retro-compat com `VITE_ALLOWED_EMAIL`
 * (singular) — se setado, vira a lista com 1 item.
 *
 * Comparação **case-insensitive**.
 */
const RAW_ALLOWED_EMAILS =
  import.meta.env.VITE_ALLOWED_EMAILS ??
  import.meta.env.VITE_ALLOWED_EMAIL ??
  ''

export const ALLOWED_EMAILS = RAW_ALLOWED_EMAILS
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** Retorna `true` se o e-mail está na lista (ou se a lista está vazia → sem gate). */
export function isEmailAllowed(email) {
  if (ALLOWED_EMAILS.length === 0) return true
  return ALLOWED_EMAILS.includes((email ?? '').trim().toLowerCase())
}

/**
 * @deprecated — use `ALLOWED_EMAILS` (array) ou `isEmailAllowed(email)`.
 * Mantido como o primeiro item da lista para call sites legados.
 */
export const ALLOWED_EMAIL = ALLOWED_EMAILS[0] ?? ''


/**
 * Traduz erros (mensagem crua do Supabase / edge function) para PT-BR.
 * Recebe a string de erro em minúsculas e retorna a mensagem amigável.
 */
export function mapLoginError(rawMessage) {
  const msg = (rawMessage ?? '').toLowerCase()

  if (msg.includes('not_allowed')) {
    return 'Esta conta não tem permissão para acessar o Gestor Magalu.'
  }
  if (msg.includes('invalid_credentials') || msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return 'E-mail ou senha incorretos.'
  }
  if (msg.includes('missing_password')) {
    return 'Informe a senha.'
  }
  if (msg.includes('otp_send_failed')) {
    return 'Não foi possível enviar o código. Tente novamente em instantes.'
  }
  if (msg.includes('token has expired') || msg.includes('expired')) {
    return 'Código expirado. Solicite um novo código.'
  }
  if (msg.includes('invalid') && (msg.includes('token') || msg.includes('otp'))) {
    return 'Código inválido. Verifique os dígitos e tente novamente.'
  }
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.'
  }
  return 'Algo deu errado. Tente novamente.'
}
