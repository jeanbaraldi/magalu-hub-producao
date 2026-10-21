// Acesso à API da Magalu (Magalu Open API) a partir das Edge Functions.
//
// Conferido na doc oficial (developers.magalu.com, 21/10/2026):
//   - troca do code: POST id.magalu.com/oauth/token em JSON;
//   - renovação: o MESMO endpoint, mas em application/x-www-form-urlencoded;
//   - access token de ~7200 s; a resposta traz um refresh_token novo: salvar na hora;
//   - a resposta do token NÃO traz a loja: ela vem de GET /seller/v1/portfolios/me
//     (tenant.id, seller.name).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { createClient } from "./supabase-schema.ts"
import { credenciaisDoHub, CHAVES_APP } from "./hub-credenciais.ts"

export const MAGALU_TOKEN_URL = "https://id.magalu.com/oauth/token"
export const MAGALU_API_BASE = "https://api.magalu.com"

type Sb = SupabaseClient<any, "public", any>

export type Credencial = {
  account_id: string
  nickname: string | null
  access_token: string
  refresh_token: string | null
  expires_at: string
}

/** Credenciais do app: Edge Function Secret > Hub > magalu.app_config. */
export async function carregarConfig(supabase: Sb): Promise<Record<string, string>> {
  const mapa: Record<string, string> = {}
  const { data } = await supabase.from("app_config").select("key, value").in("key", [...CHAVES_APP, "MAGALU_REDIRECT_URI"])
  for (const linha of data ?? []) mapa[linha.key] = linha.value
  Object.assign(mapa, await credenciaisDoHub())
  for (const k of [...CHAVES_APP, "MAGALU_REDIRECT_URI"]) {
    const v = Deno.env.get(k)
    if (v) mapa[k] = v
  }
  return mapa
}

/** Payload (claims) do JWT, sem validar assinatura: só para ler identificadores. */
export function claimsDoToken(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split(".")[1]
    if (!parte) return null
    const b64 = parte.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(parte.length / 4) * 4, "=")
    const obj = JSON.parse(atob(b64))
    return obj && typeof obj === "object" ? obj : null
  } catch {
    return null
  }
}

/**
 * Identificador da loja a partir do token, usado SÓ se GET /seller/v1/portfolios/me falhar.
 * A doc não documenta claims do JWT; sem nenhum candidato devolve null e a conexão é
 * RECUSADA (gravar sem identificador misturaria lojas).
 */
export function contaDoToken(tokenData: Record<string, unknown>): string | null {
  const claims = claimsDoToken(String(tokenData.access_token ?? "")) ?? {}
  const candidatos = [
    tokenData.tenant_id, tokenData.tenant,
    claims.tenant_id, claims.tenant, (claims.tenants as unknown[] | undefined)?.[0],
  ]
  // Sem fallback para `sub`: ele é a PESSOA que logou, não a loja. Duas lojas da mesma
  // pessoa virariam uma só conta. Sem tenant o magalu-oauth recusa a conexão.
  for (const c of candidatos) {
    const v = typeof c === "object" && c !== null ? (c as Record<string, unknown>).id : c
    const s = String(v ?? "").trim()
    if (s && s !== "undefined" && s !== "null") return s
  }
  return null
}

export function expiraEm(tokenData: Record<string, unknown>, agora = Date.now()): string {
  const seg = Number(tokenData.expires_in)
  return new Date(agora + (Number.isFinite(seg) && seg > 0 ? seg : 7200) * 1000).toISOString()
}

/** Token válido da loja; renova se faltar menos de 5 min. Refresh é de uso único. */
export async function tokenValido(supabase: Sb, cred: Credencial, config: Record<string, string>): Promise<string> {
  if (Date.now() + 5 * 60 * 1000 < new Date(cred.expires_at).getTime()) return cred.access_token
  if (!cred.refresh_token) throw new Error("NO_REFRESH_TOKEN")
  const res = await fetch(MAGALU_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.MAGALU_CLIENT_ID ?? "",
      client_secret: config.MAGALU_CLIENT_SECRET ?? "",
      refresh_token: cred.refresh_token,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.access_token) throw new Error(`REFRESH_FAILED ${res.status}`)
  const { error } = await supabase.from("magalu_credentials").update({
    access_token: data.access_token,
    // Sem refresh novo na resposta, mantém o anterior (não apaga a única chave que temos).
    refresh_token: data.refresh_token ?? cred.refresh_token,
    expires_at: expiraEm(data),
    updated_at: new Date().toISOString(),
  }).eq("account_id", cred.account_id)
  if (error) throw new Error(`Falha ao salvar o token renovado: ${error.message}`)
  return data.access_token
}

/** GET na API com Bearer; 429/5xx tenta de novo com espera crescente (3 tentativas). */
export async function mgGet(token: string, caminho: string, params: Record<string, string | number> = {}): Promise<{ status: number; body: unknown }> {
  const url = new URL(caminho, MAGALU_API_BASE)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  let ultimo = { status: 0, body: null as unknown }
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
    const body = await res.json().catch(() => null)
    ultimo = { status: res.status, body }
    if (res.status !== 429 && res.status < 500) return ultimo
    await new Promise((r) => setTimeout(r, 1000 * 2 ** tentativa))
  }
  return ultimo
}

/** A lista de uma resposta paginada, ou null se o formato não for reconhecido. */
export function listaDaResposta(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  for (const chave of ["results", "data", "items", "orders", "skus"]) {
    if (Array.isArray(b[chave])) return b[chave] as unknown[]
  }
  return null
}

/**
 * Loja autorizada pelo token, pela rota oficial GET /seller/v1/portfolios/me.
 * null quando a chamada falha ou não traz tenant.id.
 */
export async function lojaDoToken(token: string): Promise<{ id: string; nome: string | null } | null> {
  const { status, body } = await mgGet(token, "/seller/v1/portfolios/me")
  if (status !== 200 || !body || typeof body !== "object") return null
  return lojaDaRespostaMe(body)
}

/** Pura: { tenant: { id }, seller: { name } } -> { id, nome }. */
export function lojaDaRespostaMe(body: unknown): { id: string; nome: string | null } | null {
  const b = (body ?? {}) as Record<string, any>
  const id = String(b?.tenant?.id ?? "").trim()
  if (!id) return null
  const nome = String(b?.seller?.name ?? "").trim()
  return { id, nome: nome || null }
}
