// magalu-sync: espelha SKUs e pedidos de cada loja Magalu nas tabelas do schema `magalu`.
//
// Entrada (POST JSON):
//   { account_id?, kind?: "skus" | "orders" | "financeiro" | "all", days?: number, skip_days?: number }   -> tela (sessão)
//   { cron: true, kind?, days? } + header x-cron-secret                -> pg_cron, todas as lojas
// Cada rodada grava uma linha em magalu.sync_runs (o que trouxe, se truncou, qual erro).
// Orçamento de 110s (o Edge corta em ~150s): o que não coube fica marcado como truncado.
//
// Rotas e paginação (_offset/_limit) conferidas no resumo da doc oficial (21/10/2026);
// campos dos pedidos e SKUs ainda não (ver CLAUDE.md, "API da Magalu").
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { createClient } from "../_shared/supabase-schema.ts"
import { cronOuUsuario, naoAutorizado } from "../_shared/cron-auth.ts"
import { filtrarLojas, lojasDoUsuario, negarLoja, respostaLojaNegada, TODAS } from "../_shared/hub-lojas.ts"
import { carregarConfig, listaDaResposta, mgGet, tokenValido, type Credencial } from "../_shared/magalu-api.ts"
import { estoqueDaResposta, janelas15Dias, mapPedido, mapSku, mapTransacoes, semRepetidas, versaoMaisRecente, pedidosMudados, precoDaResposta } from "./logic.ts"

const CAMINHO_SKUS = "/seller/v1/portfolios/skus"
const CAMINHO_PEDIDOS = "/seller/v1/orders"
const CAMINHO_FINANCEIRO = "/seller/v1/financial-analysis/orders"
const LIMITE_PAGINA = 100
// SKUs aceitam no máximo 100 por página (spec). Teto de offset 5.000 (relatado por
// integradores, não está na spec): passado o teto a rodada para como PARCIAL.
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
  token: string, caminho: string, prazo: number, filtros: Record<string, string>,
  aoReceber: (itens: unknown[]) => Promise<boolean>, // false = parar
): Promise<Resultado> {
  let fetched = 0
  let offset = 0
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    if (Date.now() > prazo) return { fetched, truncated: true, error: null }
    const { status, body } = await mgGet(token, caminho, { ...filtros, _offset: offset, _limit: LIMITE_PAGINA })
    if (status !== 200) return { fetched, truncated: true, error: `HTTP ${status}: ${JSON.stringify(body).slice(0, 300)}` }
    const itens = listaDaResposta(body)
    if (!itens) return { fetched, truncated: true, error: `Formato de resposta não reconhecido: ${JSON.stringify(body).slice(0, 300)}` }
    fetched += itens.length
    offset += itens.length
    const seguir = await aoReceber(itens)
    // A API pode devolver menos que o pedido (meta.page.limit é o limite efetivo).
    const limiteEfetivo = Number((body as any)?.meta?.page?.limit) || LIMITE_PAGINA
    if (!seguir || itens.length === 0 || itens.length < limiteEfetivo) return { fetched, truncated: false, error: null }
  }
  return { fetched, truncated: true, error: `Teto de ${TETO_OFFSET} registros por paginação atingido; o restante não foi lido` }
}

async function registrar(supabase: Sb, accountId: string, kind: string, inicio: string, r: Resultado) {
  await supabase.from("sync_runs").insert({
    account_id: accountId, kind, started_at: inicio, finished_at: new Date().toISOString(),
    fetched: r.fetched, truncated: r.truncated, error: r.error,
  })
}

/** Grava só as colunas conhecidas, em lotes homogêneos (PostgREST não mistura chaves). */
async function gravarParcial(supabase: Sb, linhas: Record<string, unknown>[]) {
  const grupos = new Map<string, Record<string, unknown>[]>()
  for (const l of linhas) {
    const chave = Object.keys(l).sort().join(",")
    grupos.set(chave, [...(grupos.get(chave) ?? []), l])
  }
  for (const lote of grupos.values()) {
    const { error } = await supabase.from("skus").upsert(lote, { onConflict: "account_id,sku" })
    if (error) throw new Error(`Falha ao gravar preço/estoque: ${error.message}`)
  }
}

/**
 * Preço e estoque vêm de uma rota por SKU (a lista não traz). O que não foi lido mantém o
 * valor anterior: nunca grava null por cima de um preço conhecido.
 */
async function precosEEstoques(supabase: Sb, accountId: string, token: string, skus: string[], prazo: number): Promise<number> {
  let semLeitura = 0
  const fila = [...skus]
  const linhas: Record<string, unknown>[] = []
  const trabalhador = async () => {
    while (fila.length) {
      const sku = fila.shift()!
      if (Date.now() > prazo) { semLeitura++; continue }
      const enc = encodeURIComponent(sku)
      const [p, e] = await Promise.all([
        mgGet(token, `/seller/v1/portfolios/prices/${enc}`),
        mgGet(token, `/seller/v1/portfolios/stocks/${enc}`),
      ])
      const linha: Record<string, unknown> = { account_id: accountId, sku }
      const preco = p.status === 200 ? precoDaResposta(p.body) : null
      if (preco) { linha.price = preco.price; linha.list_price = preco.list_price }
      const estoque = e.status === 200 ? estoqueDaResposta(e.body) : null
      if (estoque !== null) linha.stock = estoque
      if (!preco || estoque === null) semLeitura++
      if (Object.keys(linha).length > 2) linhas.push(linha)
    }
  }
  await Promise.all(Array.from({ length: 4 }, trabalhador))
  if (linhas.length) await gravarParcial(supabase, linhas)
  return semLeitura
}

async function syncSkus(supabase: Sb, cred: Credencial, token: string, prazo: number): Promise<Resultado> {
  const inicio = new Date().toISOString()
  let semPrecoOuEstoque = 0
  const r = await paginar(token, CAMINHO_SKUS, prazo, { _sort: "sku:asc" }, async (itens) => {
    const linhas = itens.map((i) => mapSku(cred.account_id, i, inicio)).filter((l) => l !== null)
    if (linhas.length) {
      const { error } = await supabase.from("skus").upsert(linhas, { onConflict: "account_id,sku" })
      if (error) throw new Error(`Falha ao gravar SKUs: ${error.message}`)
      semPrecoOuEstoque += await precosEEstoques(supabase, cred.account_id, token, linhas.map((l) => l.sku), prazo)
    }
    return true
  })
  // SKU sem preço/estoque lido deixa a rodada PARCIAL e diz quantos.
  const final: Resultado = semPrecoOuEstoque > 0
    ? { ...r, truncated: true, error: r.error ?? `${semPrecoOuEstoque} SKU(s) sem preço ou estoque lido nesta rodada` }
    : r
  await registrar(supabase, cred.account_id, "skus", inicio, final)
  return final
}

/** Data no formato do exemplo da spec: 2021-06-18T03:05:54+00:00. */
const dataApi = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "+00:00")

async function syncPedidos(supabase: Sb, cred: Credencial, token: string, prazo: number, dias: number): Promise<Resultado> {
  const inicio = new Date().toISOString()
  // updated_at pega pedido novo E mudança de status (cancelamento, entrega) de pedido antigo.
  const filtros = { updated_at__gte: dataApi(Date.now() - dias * 86_400_000), _sort: "purchased_at:desc" }
  const r = await paginar(token, CAMINHO_PEDIDOS, prazo, filtros, async (itens) => {
    const lidas = itens.map((p) => mapPedido(cred.account_id, p, inicio)).filter((l) => l !== null)
    let linhas = lidas
    if (lidas.length) {
      const { data: gravados, error: erroLeitura } = await supabase.from("orders")
        .select("order_id, updated_at:payload->>updated_at")
        .eq("account_id", cred.account_id)
        .in("order_id", lidas.map((l) => l.order_id))
      // Falha ao ler o que já está gravado não vira "nada mudou": grava tudo, como antes.
      if (!erroLeitura) linhas = pedidosMudados(lidas, new Map((gravados ?? []).map((g) => [String(g.order_id), g.updated_at ?? null])))
    }
    if (linhas.length) {
      const { error } = await supabase.from("orders").upsert(linhas, { onConflict: "account_id,order_id" })
      if (error) throw new Error(`Falha ao gravar pedidos: ${error.message}`)
    }
    return true
  })
  await registrar(supabase, cred.account_id, "orders", inicio, r)
  return r
}

/**
 * Análise financeira dos pedidos ATUALIZADOS nos últimos `dias` (frete real, MDR, tarifas).
 * A API exige um par de datas com no máximo 15 dias: o período é lido em janelas.
 * updated_at pega transação nova de pedido antigo (repasse, estorno).
 */
async function syncFinanceiro(supabase: Sb, cred: Credencial, token: string, prazo: number, dias: number, pularDias = 0): Promise<Resultado> {
  const inicio = new Date().toISOString()
  let total: Resultado = { fetched: 0, truncated: false, error: null }
  let descartadas = 0
  for (const j of janelas15Dias(dias, Date.now() - pularDias * 86_400_000)) {
    if (Date.now() > prazo) { total = { ...total, truncated: true }; break }
    const filtros = { updated_at__gte: dataApi(j.de), updated_at__lte: dataApi(j.ate) }
    const r = await paginar(token, CAMINHO_FINANCEIRO, prazo, filtros, async (itens) => {
      const todas = []
      for (const p of versaoMaisRecente(itens)) {
        const m = mapTransacoes(cred.account_id, p, inicio)
        todas.push(...m.linhas)
        descartadas += m.descartadas
      }
      const linhas = semRepetidas(todas)
      for (let i = 0; i < linhas.length; i += 500) {
        const { error } = await supabase.from("financial_transactions")
          .upsert(linhas.slice(i, i + 500), { onConflict: "account_id,order_code,identifier" })
        if (error) throw new Error(`Falha ao gravar transações: ${error.message}`)
      }
      return true
    })
    total = { fetched: total.fetched + r.fetched, truncated: total.truncated || r.truncated, error: total.error ?? r.error }
    if (r.error) break
  }
  if (descartadas > 0) total = { ...total, truncated: true, error: total.error ?? `${descartadas} transação(ões) ilegível(is) descartada(s)` }
  await registrar(supabase, cred.account_id, "financeiro", inicio, total)
  return total
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await req.json().catch(() => ({}))
  const quem = await cronOuUsuario(req, body)
  if (!quem) return naoAutorizado(cors)

  const lojas = quem === "cron" ? TODAS : await lojasDoUsuario(req)
  if (negarLoja(lojas, body.account_id)) return respostaLojaNegada(cors)

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")
  const kind: string = ["skus", "orders", "financeiro"].includes(body.kind) ? body.kind : "all"
  // Financeiro aceita histórico mais longo (backfill em partes com `skip_days`).
  const diasMax = kind === "financeiro" ? 365 : 90
  const dias = Math.min(Math.max(Number(body.days) || 30, 1), diasMax)
  const pularDias = Math.min(Math.max(Number(body.skip_days) || 0, 0), 730)
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
      if (kind === "all" || kind === "skus") r.skus = await syncSkus(supabase, cred, token, prazo)
      if (kind === "all" || kind === "orders") r.orders = await syncPedidos(supabase, cred, token, prazo, dias)
      if (kind === "financeiro") r.financeiro = await syncFinanceiro(supabase, cred, token, prazo, dias, pularDias)
      saida.push(r)
    } catch (e) {
      // Uma loja que falha não derruba as outras.
      saida.push({ account_id: cred.account_id, error: String((e as Error).message ?? e) })
    }
  }
  return json({ ok: true, accounts: saida })
})
