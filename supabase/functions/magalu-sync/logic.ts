// Tradução PURA das respostas da API da Magalu para as linhas do espelho.
//
// ⚠️ O formato exato de SKU e de pedido NÃO foi conferido na doc oficial (bloqueada no
// ambiente de desenvolvimento). Por isso os leitores aceitam os nomes plausíveis e,
// quando nenhum bate, devolvem NULL — nunca zero. O objeto cru sempre vai em `payload`,
// então dá para corrigir o mapeamento depois sem buscar de novo na Magalu.

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
 * Aceita número, string numérica e objeto {value|amount, normalizer} (centavos com divisor).
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
    return Number.isFinite(norm) && norm > 0 ? bruto / norm : bruto
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
  price: number | null; list_price: number | null; stock: number | null
  image_url: string | null; payload: Obj; synced_at: string
}

/** null quando o item não tem identificador de SKU (não dá para gravar sem chave). */
export function mapSku(accountId: string, item: unknown, agora: string): LinhaSku | null {
  if (!ehObj(item)) return null
  const sku = texto(pegar(item, ["sku", "code", "id", "seller_sku"]))
  if (!sku) return null
  const imagem = pegar(item, ["images.0.url", "images.0", "image_url", "image", "thumbnail"])
  return {
    account_id: accountId,
    sku,
    title: texto(pegar(item, ["title", "name", "product.title", "product.name"])),
    status: texto(pegar(item, ["status", "situation", "state"])),
    price: dinheiro(pegar(item, ["price.price", "price.sale_price", "price", "prices.0.price", "sale_price"])),
    list_price: dinheiro(pegar(item, ["price.list_price", "list_price", "prices.0.list_price"])),
    stock: inteiro(pegar(item, ["stock.quantity", "stock.available", "stock", "quantity", "available_quantity"])),
    image_url: typeof imagem === "string" ? imagem : null,
    payload: item,
    synced_at: agora,
  }
}

export type LinhaPedido = {
  account_id: string; order_id: string; status: string | null; purchased_at: string | null
  total_amount: number | null; items_count: number | null; payload: Obj; synced_at: string
}

export function mapPedido(accountId: string, pedido: unknown, agora: string): LinhaPedido | null {
  if (!ehObj(pedido)) return null
  const id = texto(pegar(pedido, ["id", "code", "order_id", "number"]))
  if (!id) return null
  const itens = pegar(pedido, ["items", "order_items", "deliveries.0.items"])
  return {
    account_id: accountId,
    order_id: id,
    status: texto(pegar(pedido, ["status", "situation", "state"])),
    purchased_at: dataIso(pegar(pedido, ["purchased_at", "created_at", "approved_at", "date_created"])),
    total_amount: dinheiro(pegar(pedido, ["amounts.total", "total", "total_amount", "amount", "payment.amount"])),
    items_count: Array.isArray(itens) ? itens.length : null,
    payload: pedido,
    synced_at: agora,
  }
}

/** Status de pedido que NÃO conta como venda (mesma ideia do "sem cancelados" do ML). */
const NAO_VENDA = new Set(["cancelled", "canceled", "cancelado", "unpaid", "not_paid", "nao_pago", "pending_payment"])

export function pedidoContaComoVenda(status: string | null): boolean {
  return !!status && !NAO_VENDA.has(status.toLowerCase())
}
