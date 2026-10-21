// supabase/functions/_shared/hub-lojas.ts
//
// Suíte: quais LOJAS (lojas da Magalu, account_id) o Hub libera para quem chamou a edge.
// PRD do Hub, US-013. As edges leem com service_role, que não passa pela RLS
// suite_loja_pelo_hub; sem este guarda, um usuário restrito a uma loja pediria
// `seller_id` de outra e leria (ou alteraria) a outra loja direto na API da Magalu.
//
// Pergunta ao Hub COM O TOKEN DO USUÁRIO (hub.sem_filtro_de_loja / hub.minhas_lojas usam
// auth.uid()). Qualquer falha devolve null, e quem chama nega: aqui a edge é a única
// barreira, então falha nunca libera. Cron (segredo) e chamada interna não passam por aqui.
import { createClient } from "./supabase-schema.ts"

export const SISTEMA_NO_HUB = "magalu"

/**
 * todas = sem filtro (admin do Hub, cron): vê toda conta, inclusive a desativada no Hub.
 * Senão só as `contas`, que já são as lojas ATIVAS liberadas para a pessoa (quem está em
 * "Todas as lojas" recebe aqui a lista de todas as ativas).
 */
export type Lojas = { todas: true } | { todas: false; contas: string[] }

/** Cron (segredo) e chamada interna: a rotina do servidor segue igual, todas as contas. */
export const TODAS: Lojas = { todas: true }

type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>

/** Puro sobre o rpc: resposta que não seja exatamente boolean / lista vira null. */
export async function lerLojas(rpc: Rpc): Promise<Lojas | null> {
  try {
    const todas = await rpc("sem_filtro_de_loja", { p_sistema: SISTEMA_NO_HUB })
    if (todas.error || typeof todas.data !== "boolean") return null
    if (todas.data) return { todas: true }
    const lista = await rpc("minhas_lojas", { p_sistema: SISTEMA_NO_HUB })
    if (lista.error || !Array.isArray(lista.data)) return null
    return { todas: false, contas: lista.data.map((c) => String(c)) }
  } catch {
    return null
  }
}

export function tokenDaRequisicao(req: Request): string {
  return (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
}

/** Lojas do usuário da requisição, ou null (sem sessão, Hub sem a migration, erro). */
export async function lojasDoUsuario(req: Request): Promise<Lojas | null> {
  const token = tokenDaRequisicao(req)
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  if (!token || !url || !anon) return null
  const hub = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
    db: { schema: "hub" },
  })
  return lerLojas((fn, args) => hub.rpc(fn, args))
}

export function lojaPermitida(lojas: Lojas | null, sellerId: unknown): boolean {
  if (!lojas) return false
  const id = String(sellerId ?? "").trim()
  if (!id) return false
  return lojas.todas || lojas.contas.includes(id)
}

/** Mantém só as lojas liberadas. `id` extrai o seller_id de cada item. */
export function filtrarLojas<T>(lojas: Lojas | null, itens: T[], id: (item: T) => unknown = (item) => item): T[] {
  if (!lojas) return []
  if (lojas.todas) return itens
  return itens.filter((item) => lojaPermitida(lojas, id(item)))
}

/**
 * Conta a usar quando a edge aceita seller_id OPCIONAL (sem ele, cai na conta mais recente).
 * Pedido explícito precisa estar liberado. Sem pedido: quem vê todas segue o fallback da
 * edge (null); quem vê só algumas cai na primeira liberada, nunca na mais recente de todas.
 * `false` = negar.
 */
export function contaPedida(lojas: Lojas | null, pedido: unknown): { sellerId: string | null } | false {
  if (!lojas) return false
  const id = String(pedido ?? "").trim()
  if (id) return lojaPermitida(lojas, id) ? { sellerId: id } : false
  if (lojas.todas) return { sellerId: null }
  return lojas.contas.length ? { sellerId: lojas.contas[0] } : false
}

/**
 * Gate da edge: true = negar. Nega quando as lojas não puderam ser lidas, ou quando veio
 * um seller_id explícito fora delas. Sem seller_id passa: a edge filtra a lista depois.
 */
export function negarLoja(lojas: Lojas | null, pedido?: unknown): boolean {
  if (!lojas) return true
  const id = String(pedido ?? "").trim()
  return id !== "" && !lojaPermitida(lojas, id)
}

export const ERRO_LOJA = "loja_nao_liberada"

/** 403 padrão. `cabecalhos` = CORS da edge que chama. */
export function respostaLojaNegada(cabecalhos: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: ERRO_LOJA, message: "Esta loja da Magalu não está liberada para você no Hub." }), {
    status: 403,
    headers: { ...cabecalhos, "Content-Type": "application/json" },
  })
}

/**
 * Atalho para a edge que recebe UM seller_id do usuário: null = pode seguir;
 * Response = devolva-a (403).
 */
export async function exigirLoja(req: Request, sellerId: unknown, cabecalhos: Record<string, string> = {}): Promise<Response | null> {
  return lojaPermitida(await lojasDoUsuario(req), sellerId) ? null : respostaLojaNegada(cabecalhos)
}
