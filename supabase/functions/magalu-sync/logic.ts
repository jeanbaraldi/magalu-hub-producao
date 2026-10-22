// Tradução PURA das respostas da API da Magalu para as linhas do espelho.
//
// Campos conferidos nas specs oficiais (orders.openapi.yaml e products.openapi.yaml,
// 21/10/2026). Valor ausente vira NULL, nunca zero. O objeto cru vai em `payload`, então
// dá para corrigir o mapeamento depois sem buscar de novo na Magalu.

type Obj = Record<string, unknown>

const ehObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v)

/** Primeiro valor presente entre caminhos "a.b.c". */
export function pegar(o: unknown, caminhos: string[]): unknown {
  for (const c of caminhos) {
    let atual: unknown = o
    for (const parte of c.split(".")) {
      if (!ehObj(atual)) { atual = undefined; break }
      atual = atual[parte]
    }
    if (atual !== undefined && atual !== null && atual !== "") return atual
  }
  return undefined
}

/**
 * Valor monetário em reais, ou null.
 * Número ou string: já em reais. Objeto da Magalu ({value|amount|total, normalizer}): o
 * valor inteiro dividido pelo normalizer. Sem normalizer o objeto é ILEGÍVEL (null): a doc
 * manda não presumir 100.
 */
export function dinheiro(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."))
    return Number.isFinite(n) ? n : null
  }
  if (ehObj(v)) {
    const bruto = dinheiro(v.value ?? v.amount ?? v.total)
    if (bruto === null) return null
    const norm = Number(v.normalizer)
    return Number.isFinite(norm) && norm > 0 ? bruto / norm : null
  }
  return null
}

export function inteiro(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : null
}

export function dataIso(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const texto = (v: unknown): string | null => {
  const s = typeof v === "string" || typeof v === "number" ? String(v).trim() : ""
  return s || null
}

export type LinhaSku = {
  account_id: string; sku: string; title: string | null; status: string | null
  image_url: string | null; payload: Obj; synced_at: string
}

/**
 * Linha base do SKU (GET /seller/v1/portfolios/skus). A lista NÃO traz preço nem estoque:
 * eles vêm de /prices/{sku} e /stocks/{sku} e são gravados à parte (`precoDaResposta`,
 * `estoqueDaResposta`), para nunca apagar um valor conhecido com null.
 * null quando o item não tem SKU (não dá para gravar sem chave).
 */
export function mapSku(accountId: string, item: unknown, agora: string): LinhaSku | null {
  if (!ehObj(item)) return null
  const sku = texto(item.sku)
  if (!sku) return null
  const imagens = Array.isArray(item.images) ? item.images : []
  const primeira = imagens.find((i) => ehObj(i) && texto(i.reference))
  return {
    account_id: accountId,
    sku,
    title: texto(item.title),
    status: texto(item.status),
    image_url: primeira ? texto((primeira as Obj).reference) : null,
    payload: item,
    synced_at: agora,
  }
}

/** Canal Magalu de produção (doc: "Canais e escopos"). */
export const CANAL_MAGALU = "9fe0d853-732b-4e4a-a0b0-cff988ed043d"

/** Escolhe a linha do canal Magalu; com uma linha só, usa ela. */
function doCanal(linhas: Obj[]): Obj[] {
  const doMagalu = linhas.filter((l) => ehObj(l.channel) && (l.channel as Obj).id === CANAL_MAGALU)
  if (doMagalu.length) return doMagalu
  return linhas.length === 1 ? linhas : []
}

/** GET /prices/{sku} -> { price, list_price } em reais, ou null se ilegível. */
export function precoDaResposta(body: unknown): { price: number | null; list_price: number | null } | null {
  const linhas = ehObj(body) && Array.isArray(body.results) ? body.results.filter(ehObj) : []
  const l = doCanal(linhas)[0]
  if (!l) return null
  const norm = l.normalizer
  const price = dinheiro({ value: l.price, normalizer: norm })
  const list_price = dinheiro({ value: l.list_price, normalizer: norm })
  return price === null && list_price === null ? null : { price, list_price }
}

/**
 * GET /stocks/{sku} -> unidades AVAILABLE do canal Magalu (soma dos CDs), ou null.
 * RESERVED não é estoque vendável. Lista vazia é "não sabemos", não zero.
 */
export function estoqueDaResposta(body: unknown): number | null {
  const linhas = ehObj(body) && Array.isArray(body.results) ? body.results.filter(ehObj) : []
  const disponiveis = linhas.filter((l) => String(l.type ?? "").toUpperCase() === "AVAILABLE")
  const doMagalu = disponiveis.filter((l) => !ehObj(l.channel) || (l.channel as Obj).id === CANAL_MAGALU)
  if (!doMagalu.length) return null
  let total = 0
  for (const l of doMagalu) {
    const q = inteiro(l.quantity)
    if (q === null) return null
    total += q
  }
  return total
}

export type LinhaPedido = {
  account_id: string; order_id: string; status: string | null; purchased_at: string | null
  total_amount: number | null; items_count: number | null; payload: Obj; synced_at: string
}

const entregaCancelada = (d: unknown) => ehObj(d) && String(d.status ?? "").toLowerCase() === "cancelled"

/**
 * Total do pedido em reais. Pedido com entrega cancelada (cancelamento parcial) soma só as
 * entregas ativas; se alguma entrega ativa não tiver valor legível, o total é null.
 */
export function totalDoPedido(pedido: Obj): number | null {
  const entregas = Array.isArray(pedido.deliveries) ? pedido.deliveries : []
  const status = String(pedido.status ?? "").toLowerCase()
  if (status !== "cancelled" && entregas.some(entregaCancelada)) {
    let total = 0
    for (const d of entregas) {
      if (entregaCancelada(d)) continue
      const v = ehObj(d) ? dinheiro(d.amounts) : null
      if (v === null) return null
      total += v
    }
    return total
  }
  return dinheiro(pedido.amounts)
}

/** GET /seller/v1/orders: `id` é a chave; `code` é o número que o comprador vê. */
export function mapPedido(accountId: string, pedido: unknown, agora: string): LinhaPedido | null {
  if (!ehObj(pedido)) return null
  const id = texto(pedido.id) ?? texto(pedido.code)
  if (!id) return null
  const entregas = Array.isArray(pedido.deliveries) ? pedido.deliveries : null
  return {
    account_id: accountId,
    order_id: id,
    status: texto(pedido.status),
    purchased_at: dataIso(pedido.purchased_at ?? pedido.created_at),
    total_amount: totalDoPedido(pedido),
    items_count: entregas ? entregas.reduce((n, d) => n + (ehObj(d) && Array.isArray(d.items) ? d.items.length : 0), 0) : null,
    payload: pedido,
    synced_at: agora,
  }
}

/**
 * Só os pedidos que mudaram desde a última gravação, pelo `updated_at` da Magalu.
 * O sync roda a cada minuto e a API devolve os pedidos do dia todo: regravar os iguais
 * dispararia o Realtime (Vendas Hoje e o card do Hub) a cada rodada sem venda nova.
 * Pedido sem `updated_at`, ou que não estava gravado, é sempre gravado.
 */
export function pedidosMudados(linhas: LinhaPedido[], gravados: Map<string, string | null>): LinhaPedido[] {
  return linhas.filter((l) => {
    const novo = texto(l.payload.updated_at)
    if (!novo || !gravados.has(l.order_id)) return true
    return gravados.get(l.order_id) !== novo
  })
}

/**
 * Status de pedido que NÃO conta como venda. Doc: new (criado, pagamento não aprovado),
 * approved, cancelled (todas as entregas canceladas), finished. `new` fica fora: ainda não
 * é dinheiro, mesma régua do "pago" do Gestor ML.
 */
const NAO_VENDA = new Set(["new", "cancelled", "canceled", "cancelado", "unpaid", "not_paid", "nao_pago", "pending_payment"])

export function pedidoContaComoVenda(status: string | null): boolean {
  return !!status && !NAO_VENDA.has(status.toLowerCase())
}
