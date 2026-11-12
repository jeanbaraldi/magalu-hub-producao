// magalu-atendimento: espelho de perguntas, protocolos do SAC e conversas da Magalu (para a
// aba Atendimento do Hub) e envio de respostas com o login de quem responde.
//
// Entrada (POST JSON):
//   { cron: true } + header x-cron-secret               -> sincroniza todas as lojas
//   { account_id? }  (sessão)                            -> sincroniza as lojas liberadas
//   { acao: "responder", tipo: "pergunta"|"protocolo"|"conversa", id, account_id, texto } (sessão)
//
// Responder exige: login autorizado, loja liberada no Hub e nível de ESCRITA em algum módulo
// da Magalu no Hub (mesmo critério do ml-proxy). A Magalu ainda exige escopo de escrita no
// token da loja; sem ele devolve 401/403 e a resposta diz qual escopo falta.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { createClient } from "../_shared/supabase-schema.ts"
import { cronOuUsuario, naoAutorizado } from "../_shared/cron-auth.ts"
import { filtrarLojas, lojaPermitida, lojasDoUsuario, negarLoja, respostaLojaNegada, TODAS, tokenDaRequisicao } from "../_shared/hub-lojas.ts"
import { carregarConfig, listaDaResposta, tokenValido, type Credencial } from "../_shared/magalu-api.ts"
import {
  conversaAguardaLoja, corpoResposta, ESCOPO_ESCRITA, LIMITE_TEXTO, mapConversa, mapMensagemConversa,
  mapMensagemProtocolo, mapPergunta, mapProtocolo, protocoloAguardaLoja, temEscopo, type TipoResposta,
} from "./logic.ts"

const API = "https://api.magalu.com"
const SERVICES = "https://services.magalu.com"
const ORCAMENTO_MS = 110_000
const LIMITE = 100
const MAX_PAGINAS = 20
// Protocolos e conversas: só os que mudaram nesta janela entram na revisão de mensagens.
const JANELA_DIAS = 30

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } })

type Sb = SupabaseClient<any, "public", any>
type Cred = Credencial & { scope?: string | null }

async function chamar(token: string, url: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  let ultimo = { status: 0, body: null as any }
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const res = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) },
    })
    const texto = await res.text()
    let body: any = null
    try { body = texto ? JSON.parse(texto) : null } catch { body = texto }
    ultimo = { status: res.status, body }
    // Escrita não repete: um 5xx pode ter sido gravado do outro lado.
    if (init.method && init.method !== "GET") return ultimo
    if (res.status !== 429 && res.status < 500) return ultimo
    await new Promise((r) => setTimeout(r, 1000 * 2 ** tentativa))
  }
  return ultimo
}

/** Lê todas as páginas de uma lista (_offset/_limit). `parar` corta cedo (lista ordenada). */
async function paginar(token: string, base: string, filtros: Record<string, string>, prazo: number, parar?: (item: any) => boolean) {
  const itens: any[] = []
  let offset = 0
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    if (Date.now() > prazo) return { itens, parcial: true, erro: null as string | null }
    const url = new URL(base)
    for (const [k, v] of Object.entries({ ...filtros, _offset: String(offset), _limit: String(LIMITE) })) url.searchParams.set(k, v)
    const { status, body } = await chamar(token, url.toString())
    if (status !== 200) return { itens, parcial: true, erro: `HTTP ${status} em ${url.pathname}: ${JSON.stringify(body).slice(0, 200)}` }
    const lista = listaDaResposta(body)
    if (!lista) return { itens, parcial: true, erro: `Resposta sem lista em ${url.pathname}` }
    for (const i of lista) {
      if (parar?.(i)) return { itens, parcial: false, erro: null }
      itens.push(i)
    }
    offset += lista.length
    const limiteEfetivo = Number(body?.meta?.page?.limit) || LIMITE
    if (lista.length === 0 || lista.length < limiteEfetivo) return { itens, parcial: false, erro: null }
  }
  return { itens, parcial: true, erro: `Mais de ${MAX_PAGINAS * LIMITE} registros; o restante não foi lido` }
}

async function gravar(supabase: Sb, tabela: string, linhas: Record<string, unknown>[], conflito: string) {
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await supabase.from(tabela).upsert(linhas.slice(i, i + 500), { onConflict: conflito })
    if (error) throw new Error(`Falha ao gravar ${tabela}: ${error.message}`)
  }
}

async function syncLoja(supabase: Sb, cred: Cred, token: string, prazo: number) {
  const agora = new Date().toISOString()
  const desde = Date.now() - JANELA_DIAS * 86_400_000
  const r: Record<string, unknown> = { account_id: cred.account_id }
  const erros: string[] = []

  // Perguntas que pedem ação da loja: aguardando resposta e resposta recusada na moderação.
  // As que saíram desse estado são relidas uma a uma logo abaixo.
  const aguardando = await paginar(token, `${SERVICES}/v0/questions`, { status: "WAITING_RESPONSE" }, prazo)
  const recusadas = await paginar(token, `${SERVICES}/v0/questions`, { status: "RESPONSE_REJECTED" }, prazo)
  const pendentes = { itens: [...aguardando.itens, ...recusadas.itens], parcial: aguardando.parcial || recusadas.parcial }
  const perguntas = pendentes.itens.map((q) => mapPergunta(cred.account_id, q, agora)).filter((x) => x !== null)
  const unicas = [...new Map(perguntas.map((p) => [p!.id, p])).values()] as Record<string, unknown>[]
  await gravar(supabase, "questions", unicas, "account_id,id")
  // Pergunta que era pendente no espelho e não veio pendente agora: relê o status.
  if (!pendentes.parcial) {
    const ids = new Set(pendentes.itens.map((q) => q?.id))
    const { data } = await supabase.from("questions").select("id").eq("account_id", cred.account_id).in("status", ["WAITING_RESPONSE", "RESPONSE_REJECTED"])
    for (const { id } of data ?? []) {
      if (ids.has(id) || Date.now() > prazo) continue
      const { status, body } = await chamar(token, `${SERVICES}/v0/questions/${encodeURIComponent(id)}`)
      if (status === 200) await gravar(supabase, "questions", [mapPergunta(cred.account_id, body, agora)!].filter(Boolean), "account_id,id")
      else if (status === 404) await supabase.from("questions").update({ status: "DELETED", synced_at: agora }).eq("account_id", cred.account_id).eq("id", id)
    }
  }
  r.perguntas = { pendentes: unicas.length, parcial: pendentes.parcial }
  for (const e of [aguardando.erro, recusadas.erro]) if (e) erros.push(e)

  // Protocolos do SAC mudados na janela; mensagens dos que aguardam a loja ou mudaram.
  const prot = await paginar(token, `${API}/seller/v0/tickets`, { updated_at_gte: new Date(desde).toISOString().slice(0, 19) }, prazo)
  if (prot.erro) erros.push(prot.erro)
  const protocolos = prot.itens.map((t) => mapProtocolo(cred.account_id, t, agora)).filter((x) => x !== null)
  const { data: antigos } = await supabase.from("tickets").select("id, updated_at_ml, messages_synced_at").eq("account_id", cred.account_id)
  const antes = new Map((antigos ?? []).map((t: any) => [t.id, t]))
  await gravar(supabase, "tickets", protocolos as Record<string, unknown>[], "account_id,id")
  let mensagensProt = 0
  for (const t of protocolos) {
    if (!t || Date.now() > prazo) continue
    const anterior: any = antes.get(t.id)
    const mudou = !anterior?.messages_synced_at || anterior.updated_at_ml !== t.updated_at_ml
    if (!mudou && !protocoloAguardaLoja(t.status)) continue
    const m = await paginar(token, `${API}/seller/v0/tickets/${encodeURIComponent(t.id)}/messages`, {}, prazo)
    if (m.erro) { erros.push(m.erro); continue }
    const linhas = m.itens.map((x) => mapMensagemProtocolo(cred.account_id, t.id, x, agora)).filter((x) => x !== null)
    await gravar(supabase, "ticket_messages", linhas as Record<string, unknown>[], "account_id,ticket_id,id")
    await supabase.from("tickets").update({ messages_synced_at: agora }).eq("account_id", cred.account_id).eq("id", t.id)
    mensagensProt += linhas.length
  }
  r.protocolos = { lidos: protocolos.length, aguardando: protocolos.filter((t) => protocoloAguardaLoja(t!.status)).length, mensagens: mensagensProt, parcial: prot.parcial }

  // Conversas abertas; mensagens das que o cliente falou por último ou mudaram.
  const conv = await paginar(token, `${SERVICES}/v0/conversations`, { status: "OPENED" }, prazo)
  if (conv.erro) erros.push(conv.erro)
  const conversas = conv.itens.map((c) => mapConversa(cred.account_id, c, agora)).filter((x) => x !== null)
  const { data: convAntigas } = await supabase.from("conversations").select("id, last_interaction_at, messages_synced_at, status").eq("account_id", cred.account_id)
  const convAntes = new Map((convAntigas ?? []).map((c: any) => [c.id, c]))
  await gravar(supabase, "conversations", conversas as Record<string, unknown>[], "account_id,id")
  // Abertas no espelho que não vieram abertas agora foram fechadas na Magalu.
  if (!conv.parcial) {
    const abertas = new Set(conversas.map((c) => c!.id))
    const fechar = (convAntigas ?? []).filter((c: any) => c.status === "OPENED" && !abertas.has(c.id)).map((c: any) => c.id)
    if (fechar.length) await supabase.from("conversations").update({ status: "CLOSED", synced_at: agora }).eq("account_id", cred.account_id).in("id", fechar)
  }
  let mensagensConv = 0
  for (const c of conversas) {
    if (!c || Date.now() > prazo) continue
    const anterior: any = convAntes.get(c.id)
    const mudou = !anterior?.messages_synced_at || Date.parse(anterior.last_interaction_at ?? "") !== Date.parse(c.last_interaction_at ?? "")
    if (!mudou) continue
    const m = await paginar(token, `${SERVICES}/v0/conversations/${encodeURIComponent(c.id)}/messages`, {}, prazo)
    if (m.erro) { erros.push(m.erro); continue }
    const linhas = m.itens.map((x) => mapMensagemConversa(cred.account_id, c.id, x, agora)).filter((x) => x !== null)
    await gravar(supabase, "conversation_messages", linhas as Record<string, unknown>[], "account_id,conversation_id,id")
    await supabase.from("conversations").update({ messages_synced_at: agora }).eq("account_id", cred.account_id).eq("id", c.id)
    mensagensConv += linhas.length
  }
  r.conversas = { abertas: conversas.length, aguardando: conversas.filter((c) => conversaAguardaLoja(c!)).length, mensagens: mensagensConv, parcial: conv.parcial }
  r.escopo_resposta = Object.fromEntries((Object.keys(ESCOPO_ESCRITA) as TipoResposta[]).map((t) => [t, temEscopo(cred.scope, t)]))
  if (erros.length) r.erros = erros
  return r
}

/** Nível de escrita em algum módulo da Magalu no Hub (mesmo critério do ml-proxy). */
async function temEscritaMagalu(token: string): Promise<boolean> {
  const hub = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
    db: { schema: "hub" },
  })
  try {
    const { data, error } = await hub.rpc("meus_niveis", { p_sistema: "magalu" })
    if (error) { console.error("[magalu-atendimento] meus_niveis:", error.message); return false }
    return Array.isArray(data) && data.some((n: { nivel?: string }) => n?.nivel === "escrita")
  } catch {
    return false
  }
}

async function responder(req: Request, body: any, supabase: Sb) {
  const tipo = body.tipo as TipoResposta
  if (!(tipo in ESCOPO_ESCRITA)) return json({ error: "tipo_invalido" }, 400)
  const id = String(body.id ?? "").trim()
  const texto = String(body.texto ?? "").trim()
  if (!id || !texto) return json({ error: "id_e_texto_obrigatorios" }, 400)
  if (texto.length > LIMITE_TEXTO[tipo]) return json({ error: "texto_longo", message: `Máximo de ${LIMITE_TEXTO[tipo]} caracteres.` }, 400)

  if (!lojaPermitida(await lojasDoUsuario(req), body.account_id)) return respostaLojaNegada(cors)
  if (!(await temEscritaMagalu(tokenDaRequisicao(req)))) return json({ error: "sem_escrita", message: "Responder exige nível de escrita na Magalu pelo Hub." }, 403)

  const { data: cred, error } = await supabase.from("magalu_credentials").select("*").eq("account_id", String(body.account_id)).maybeSingle()
  if (error || !cred) return json({ error: "loja_sem_credencial" }, 404)
  const token = await tokenValido(supabase, cred as Cred, await carregarConfig(supabase))
  const autor = { nome: String(cred.nickname ?? "Loja"), codigo: "hub-atendimento" }

  const url = tipo === "pergunta" ? `${SERVICES}/v0/questions/${encodeURIComponent(id)}/answer`
    : tipo === "protocolo" ? `${API}/seller/v0/tickets/${encodeURIComponent(id)}/messages`
    : `${SERVICES}/v0/conversations/${encodeURIComponent(id)}/messages`
  const { status, body: resposta } = await chamar(token, url, { method: "POST", body: JSON.stringify(corpoResposta(tipo, texto, autor)) })
  if (status === 401 || status === 403) {
    return json({
      error: "sem_escopo",
      escopo: ESCOPO_ESCRITA[tipo],
      message: `A Magalu recusou: o token da loja não tem permissão de resposta (${ESCOPO_ESCRITA[tipo]}). Reconecte a loja no Gestor Magalu depois de liberar o escopo no app.`,
      detalhe: resposta,
    }, 403)
  }
  if (status < 200 || status >= 300) return json({ error: "magalu_recusou", status, detalhe: resposta }, 502)

  // Releitura do que mudou, para a fila refletir sem esperar o cron.
  const agora = new Date().toISOString()
  if (tipo === "pergunta") {
    const r = await chamar(token, `${SERVICES}/v0/questions/${encodeURIComponent(id)}`)
    if (r.status === 200) await gravar(supabase, "questions", [mapPergunta(String(body.account_id), r.body, agora)!].filter(Boolean), "account_id,id")
  } else if (tipo === "protocolo") {
    await supabase.from("tickets").update({ messages_synced_at: null }).eq("account_id", String(body.account_id)).eq("id", id)
  } else {
    await supabase.from("conversations").update({ messages_synced_at: null, last_from_type: "SELLER", synced_at: agora }).eq("account_id", String(body.account_id)).eq("id", id)
  }
  return json({ ok: true, status, resposta })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  const body = await req.json().catch(() => ({}))
  const quem = await cronOuUsuario(req, body)
  if (!quem) return naoAutorizado(cors)
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

  if (body.acao === "responder") {
    if (quem !== "usuario") return json({ error: "responder_exige_sessao" }, 403)
    try {
      return await responder(req, body, supabase)
    } catch (e) {
      return json({ error: String((e as Error).message ?? e) }, 500)
    }
  }

  const lojas = quem === "cron" ? TODAS : await lojasDoUsuario(req)
  if (negarLoja(lojas, body.account_id)) return respostaLojaNegada(cors)
  let q = supabase.from("magalu_credentials").select("*")
  if (body.account_id) q = q.eq("account_id", String(body.account_id))
  const { data, error } = await q
  if (error) return json({ error: error.message }, 500)
  const creds = filtrarLojas(lojas, (data ?? []) as Cred[], (c) => c.account_id)
  // Lojas que ficaram para trás na rodada anterior vão primeiro: gira pela hora.
  const inicio = creds.length ? new Date().getUTCMinutes() % creds.length : 0
  const fila = [...creds.slice(inicio), ...creds.slice(0, inicio)]

  const prazo = Date.now() + ORCAMENTO_MS
  const config = await carregarConfig(supabase)
  const saida: Record<string, unknown>[] = []
  for (const cred of fila) {
    if (Date.now() > prazo) { saida.push({ account_id: cred.account_id, skipped: "sem_tempo" }); continue }
    try {
      saida.push(await syncLoja(supabase, cred, await tokenValido(supabase, cred, config), prazo))
    } catch (e) {
      saida.push({ account_id: cred.account_id, error: String((e as Error).message ?? e) })
    }
  }
  return json({ ok: true, accounts: saida })
})
