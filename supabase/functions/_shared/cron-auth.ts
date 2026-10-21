// supabase/functions/_shared/cron-auth.ts
//
// Autenticação do pg_cron nas functions com verify_jwt=false.
//
// Antes, `{"cron": true}` no corpo bastava para rodar a rotina como cron — sem
// sessão e sem segredo. Com verify_jwt=false, qualquer pessoa com a URL do
// projeto disparava sincronizações (cota da API da Magalu) e outras rotinas (crédito
// de IA). Agora o cron também PROVA um segredo: header `x-cron-secret` igual a
// CRON_SECRET (Edge Function Secret, que vence; senão a linha de app_config,
// que o setup.sh semeia). Sem segredo configurado, ninguém passa como cron.
import { createClient } from "./supabase-schema.ts"

export const CRON_SECRET_KEY = "CRON_SECRET"

export async function segredoDoCron(): Promise<string> {
  const env = (Deno.env.get(CRON_SECRET_KEY) ?? "").trim()
  if (env) return env
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!url || !key) return ""
  const { data } = await createClient(url, key).from("app_config").select("value").eq("key", CRON_SECRET_KEY).maybeSingle()
  return String(data?.value ?? "").trim()
}

// Compara por digest SHA-256 de tamanho fixo, sem sair no primeiro byte diferente:
// o tempo não revela quanto do segredo bateu.
export async function mesmoSegredo(recebido: string, esperado: string): Promise<boolean> {
  if (!recebido || !esperado) return false
  const enc = new TextEncoder()
  const [a, b] = await Promise.all([recebido, esperado].map((v) => crypto.subtle.digest("SHA-256", enc.encode(v))))
  const x = new Uint8Array(a), y = new Uint8Array(b)
  let dif = 0
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i]
  return dif === 0
}

/** true só quando o corpo pede modo cron E o header prova o segredo. */
export async function cronAutorizado(
  req: Request,
  body: unknown,
  lerSegredo: () => Promise<string> = segredoDoCron,
): Promise<boolean> {
  if ((body as { cron?: unknown } | null)?.cron !== true) return false
  const recebido = (req.headers.get("x-cron-secret") ?? "").trim()
  if (!recebido) return false
  return mesmoSegredo(recebido, await lerSegredo())
}

// ─── Chamada manual: sessão do Supabase Auth + allowlist ─────────────────────
// Mesmo gate das functions de usuário (getAuthorizedUser): token de sessão
// válido (a anon sozinha não é sessão) e, se ALLOWED_EMAILS estiver preenchida,
// e-mail dentro dela.
function allowlist(): string[] {
  return (Deno.env.get("ALLOWED_EMAILS") ?? Deno.env.get("ALLOWED_EMAIL") ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
}

export async function usuarioAutorizado(req: Request): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  if (!url || !anon || !token || token === anon) return false
  const { data, error } = await createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }).auth.getUser(token)
  if (error || !data?.user) return false
  const lista = allowlist()
  return lista.length === 0 || lista.includes((data.user.email ?? "").toLowerCase())
}

/**
 * Gate das functions que o cron E a tela chamam: "cron" com o segredo, "usuario"
 * com sessão autorizada, ou null (responder 401 ANTES de qualquer leitura).
 */
export async function cronOuUsuario(
  req: Request,
  body: unknown,
  deps: { lerSegredo?: () => Promise<string>; usuario?: (r: Request) => Promise<boolean> } = {},
): Promise<"cron" | "usuario" | null> {
  if (await cronAutorizado(req, body, deps.lerSegredo)) return "cron"
  if (await (deps.usuario ?? usuarioAutorizado)(req)) return "usuario"
  return null
}

export function naoAutorizado(cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } })
}
