// magalu-oauth: conecta, lista e desconecta lojas da Magalu (ID Magalu, OAuth 2.0).
// Mesmo contrato do ml-oauth do Gestor ML:
//   GET ?action=list_accounts           -> lojas que o Hub libera para quem chamou
//   GET ?code=...&redirect_uri=...      -> troca o código e grava a loja
//   GET ?action=disconnect&account_id=  -> apaga a credencial da loja
// Toda ação exige sessão de usuário (a anon key sozinha não passa).
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "../_shared/supabase-schema.ts"
import { filtrarLojas, lojaPermitida, lojasDoUsuario, respostaLojaNegada } from "../_shared/hub-lojas.ts"
import { carregarConfig, claimsDoToken, contaDoToken, expiraEm, lojaDoToken, MAGALU_TOKEN_URL, tokenValido, type Credencial } from "../_shared/magalu-api.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const ALLOWED_EMAILS = (Deno.env.get("ALLOWED_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

function primeiroPreenchido(...valores: (string | null | undefined)[]): string {
  for (const v of valores) {
    const s = (v ?? "").trim()
    if (s) return s
  }
  return ""
}

async function usuarioAutorizado(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  if (!token || token === SUPABASE_ANON_KEY) return null
  const { data, error } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.getUser(token)
  if (error || !data?.user) return null
  if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes((data.user.email ?? "").toLowerCase())) return null
  return data.user
}

/** Nome legível da loja, se o token trouxer. Sem nome, o Hub mostra "Loja <id>". */
function nomeDaLoja(tokenData: Record<string, unknown>): string | null {
  const claims = claimsDoToken(String(tokenData.access_token ?? "")) ?? {}
  for (const c of [tokenData.tenant_name, claims.tenant_name, claims.name, claims.preferred_username]) {
    const s = String(c ?? "").trim()
    if (s && s !== "undefined") return s
  }
  return null
}

/** Registra a tentativa de conexão (sem token). Falha aqui nunca derruba a conexão. */
async function registrarTentativa(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  etapa: string,
  statusHttp: number | null,
  redirectUri: string | null,
  detalhe: unknown,
) {
  try {
    await supabase.from("conexao_tentativas").insert({ etapa, status_http: statusHttp, redirect_uri: redirectUri, detalhe: detalhe ?? null })
  } catch (e) {
    console.error("[magalu-oauth] registro da tentativa falhou", e)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const url = new URL(req.url)
  const temCode = Boolean(url.searchParams.get("code"))
  if (!(await usuarioAutorizado(req))) {
    if (temCode) await registrarTentativa(supabase, "sessao", 401, url.searchParams.get("redirect_uri"), { erro: "sessão do painel ausente ou e-mail fora de ALLOWED_EMAILS" })
    return json({ error: "unauthorized" }, 401)
  }
  const action = url.searchParams.get("action")
  const code = url.searchParams.get("code")

  try {
    if (action === "list_accounts") {
      const lojas = await lojasDoUsuario(req)
      if (!lojas) return json({ error: "lojas_indisponiveis", message: "Não foi possível conferir no Hub quais lojas você pode ver. Tente novamente." }, 403)
      const { data, error } = await supabase.from("magalu_credentials").select("*").order("updated_at", { ascending: false })
      if (error) throw new Error(`DB error: ${error.message}`)
      if (!data?.length) return json([])
      const creds = filtrarLojas(lojas, data as Credencial[], (c) => c.account_id)
      if (!creds.length) return json({ error: "loja_nao_liberada", message: "Nenhuma loja da Magalu está liberada para você no Hub. Peça ao administrador." }, 403)

      const config = await carregarConfig(supabase)
      const contas = await Promise.all(creds.map(async (c) => {
        const base = { id: c.account_id, account_id: c.account_id, seller_id: c.account_id, nickname: c.nickname ?? `Loja ${c.account_id}`, expires_at: c.expires_at }
        try {
          await tokenValido(supabase, c, config)
          return { ...base, needs_reconnect: false }
        } catch (e) {
          // Refresh falhou ou não existe: a loja continua na lista, pedindo reconexão.
          return { ...base, needs_reconnect: true, error: String((e as Error).message) }
        }
      }))
      return json(contas)
    }

    if (action === "disconnect") {
      const id = url.searchParams.get("account_id")
      if (!lojaPermitida(await lojasDoUsuario(req), id)) return respostaLojaNegada(cors)
      const { error } = await supabase.from("magalu_credentials").delete().eq("account_id", id)
      if (error) throw new Error(error.message)
      return json({ ok: true })
    }

    if (code) {
      const config = await carregarConfig(supabase)
      if (!config.MAGALU_CLIENT_ID || !config.MAGALU_CLIENT_SECRET) {
        await registrarTentativa(supabase, "config", null, url.searchParams.get("redirect_uri"), { erro: "Client ID ou Secret ausente" })
        return json({ error: "Credenciais do app Magalu ausentes", details: "Cadastre Client ID e Client Secret da Magalu no Hub (Conexões)." }, 400)
      }
      const redirectUri = primeiroPreenchido(url.searchParams.get("redirect_uri"), config.MAGALU_REDIRECT_URI)
      const res = await fetch(MAGALU_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.MAGALU_CLIENT_ID,
          client_secret: config.MAGALU_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code,
          grant_type: "authorization_code",
        }),
      })
      const tokenData = await res.json().catch(() => ({}))
      if (!res.ok || !tokenData?.access_token) {
        await registrarTentativa(supabase, "troca", res.status, redirectUri, { client_id: config.MAGALU_CLIENT_ID, resposta: tokenData })
        return json({ error: "Troca do código falhou", details: tokenData }, 400)
      }
      // Loja pela rota oficial; as claims do JWT são só o plano B.
      const loja = await lojaDoToken(String(tokenData.access_token))
      const accountId = loja?.id ?? contaDoToken(tokenData)
      if (!accountId) {
        await registrarTentativa(supabase, "loja", null, redirectUri, { scope: tokenData.scope ?? null, claims: claimsDoToken(String(tokenData.access_token)) })
        return json({ error: "Não foi possível identificar a loja autorizada", details: "GET /seller/v1/portfolios/me não respondeu com a loja. Confira se o escopo open:portfolio-skus-seller:read está habilitado no app." }, 400)
      }
      const claims = claimsDoToken(String(tokenData.access_token)) ?? {}
      const { error } = await supabase.from("magalu_credentials").upsert({
        account_id: accountId,
        nickname: loja?.nome ?? nomeDaLoja(tokenData),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at: expiraEm(tokenData),
        scope: tokenData.scope ?? null,
        // Só claims: sem o token em si, para inspecionar o formato depois.
        token_payload: claims,
        updated_at: new Date().toISOString(),
      }, { onConflict: "account_id" })
      if (error) {
        await registrarTentativa(supabase, "gravar", null, redirectUri, { account_id: accountId, erro: error.message })
        throw new Error(`Falha ao salvar a loja: ${error.message}`)
      }
      await registrarTentativa(supabase, "ok", 200, redirectUri, { account_id: accountId, nome: loja?.nome ?? null, scope: tokenData.scope ?? null })
      return json({ ok: true, account_id: accountId })
    }

    return json({ error: "ação desconhecida" }, 400)
  } catch (e) {
    console.error("[magalu-oauth]", e)
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
