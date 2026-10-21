// magalu-sync: espelha SKUs e pedidos de cada loja Magalu nas tabelas do schema `magalu`.
//
// Entrada (POST JSON):
//   { account_id?, kind?: "skus" | "orders" | "all", days?: number }   -> tela (sessão)
//   { cron: true, kind?, days? } + header x-cron-secret                -> pg_cron, todas as lojas
// Cada rodada grava uma linha em magalu.sync_runs (o que trouxe, se truncou, qual erro).
// Orçamento de 110s (o Edge corta em ~150s): o que não coube fica marcado como truncado.
//
// ⚠️ Caminhos e paginação da API NÃO validados na doc oficial. Ficam nas constantes abaixo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { createClient } from "../_shared/supabase-schema.ts"
import { cronOuUsuario, naoAutorizado } from "../_shared/cron-auth.ts"
import { filtrarLojas, lojasDoUsuario, negarLoja, respostaLojaNegada, TODAS } from "../_shared/hub-lojas.ts"
import { carregarConfig, listaDaResposta, mgGet, tokenValido, type Credencial } from "../_shared/magalu-api.ts"
import { mapPedido, mapSku } from "./logic.ts"

const CAMINHO_SKUS = "/seller/v1/portfolios/skus"
const CAMINHO_PEDIDOS = "/seller/v1/orders"
const LIMITE_PAGINA = 100
// A Magalu não aceita offset acima de 5.000 (relatado por integradores, não está na doc
// indexada): passado o teto a rodada para como PARCIAL, nunca como completa.
const TETO_OFFSET = 5000
const MAX_PAGINAS = TETO_OFFSET / LIMITE_PAGINA
const ORCAMENTO_MS = 110_000

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } })

type Sb = SupabaseClient<any, "public", any>
type Resultado = { fetched: number; truncated: boolean; error: string | null }

async function paginar(
  token: string, caminho: string, prazo: number,
  aoReceber: (itens: unknown[]) => Promise<boolean>, // false = parar (ex.: saiu da janela)
): Promise<Resultado> {
  let fetched = 0
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    if (Date.now() > prazo) return { fetched, truncated: true, error: null }
    const { status, body } = await mgGet(token, caminho, { _offset: pagina * LIMITE_PAGINA, _limit: LIMITE_PAGINA })
    if (status !== 200) return { fetched, truncated: true, error: `HTTP ${status}: ${JSON.stringify(body).slice(0, 300)}` }
    const itens = listaDaResposta(body)
    if (!itens) return { fetched, truncated: true, error: `Formato de resposta não reconhecido: ${JSON.stringify(body).slice(0, 300)}` }
    fetched += itens.length
    const seguir = await aoReceber(itens)
    if (!seguir || itens.length < LIMITE_PAGINA) return { fetched, truncated: false, error: null }
  }
  return { fetched, truncated: true, error: `Teto de ${TETO_OFFSET} registros por paginação atingido; o restante não foi lido` }
}

async function registrar(supabase: Sb, accountId: string, kind: string, inicio: string, r: Resultado) {
  await supabase.from("sync_runs").insert({
    account_id: accountId, kind, started_at: inicio, finished_at: new Date().toISOString(),
    fetched: r.fetched, truncated: r.truncated, error: r.error,
  })
}

async function syncSkus(supabase: Sb, cred: Credencial, token: string, prazo: number): Promise<Resultado> {
  const inicio = new Date().toISOString()
  const r = await paginar(token, CAMINHO_SKUS, prazo, async (itens) => {
    const linhas = itens.map((i) => mapSku(cred.account_id, i, inicio)).filter((l) => l !== null)
    if (linhas.length) {
      const { error } = await supabase.from("skus").upsert(linhas, { onConflict: "account_id,sku" })
      if (error) throw new Error(`Falha ao gravar SKUs: ${error.message}`)
    }
    return true
  })
  await registrar(supabase, cred.account_id, "skus", inicio, r)
  return r
}

async function syncPedidos(supabase: Sb, cred: Credencial, token: string, prazo: number, dias: number): Promise<Resultado> {
  const inicio = new Date().toISOString()
  const corte = Date.now() - dias * 86_400_000
  const r = await paginar(token, CAMINHO_PEDIDOS, prazo, async (itens) => {
    const linhas = itens.map((p) => mapPedido(cred.account_id, p, inicio)).filter((l) => l !== null)
    if (linhas.length) {
      const { error } = await supabase.from("orders").upsert(linhas, { onConflict: "account_id,order_id" })
      if (error) throw new Error(`Falha ao gravar pedidos: ${error.message}`)
    }
    // Para quando a página inteira já é anterior à janela. Data ilegível não decide nada.
    const datas = linhas.map((l) => l.purchased_at).filter((d): d is string => !!d).map((d) => new Date(d).getTime())
    return !(datas.length === linhas.length && datas.length > 0 && Math.max(...datas) < corte)
  })
  await registrar(supabase, cred.account_id, "orders", inicio, r)
  return r
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await req.json().catch(() => ({}))
  const quem = await cronOuUsuario(req, body)
  if (!quem) return naoAutorizado(cors)

  const lojas = quem === "cron" ? TODAS : await lojasDoUsuario(req)
  if (negarLoja(lojas, body.account_id)) return respostaLojaNegada(cors)

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")
  const kind: string = ["skus", "orders"].includes(body.kind) ? body.kind : "all"
  const dias = Math.min(Math.max(Number(body.days) || 30, 1), 90)
  const prazo = Date.now() + ORCAMENTO_MS

  let q = supabase.from("magalu_credentials").select("*")
  if (body.account_id) q = q.eq("account_id", String(body.account_id))
  const { data, error } = await q
  if (error) return json({ error: error.message }, 500)
  const creds = filtrarLojas(lojas, (data ?? []) as Credencial[], (c) => c.account_id)

  const config = await carregarConfig(supabase)
  const saida: Record<string, unknown>[] = []
  for (const cred of creds) {
    if (Date.now() > prazo) { saida.push({ account_id: cred.account_id, skipped: "sem_tempo" }); continue }
    try {
      const token = await tokenValido(supabase, cred, config)
      const r: Record<string, unknown> = { account_id: cred.account_id }
      if (kind !== "orders") r.skus = await syncSkus(supabase, cred, token, prazo)
      if (kind !== "skus") r.orders = await syncPedidos(supabase, cred, token, prazo, dias)
      saida.push(r)
    } catch (e) {
      // Uma loja que falha não derruba as outras.
      saida.push({ account_id: cred.account_id, error: String((e as Error).message ?? e) })
    }
  }
  return json({ ok: true, accounts: saida })
})
