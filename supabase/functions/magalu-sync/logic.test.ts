import { assertEquals } from "jsr:@std/assert@1"
import { dinheiro, estoqueDaResposta, mapPedido, mapSku, pedidoContaComoVenda, precoDaResposta, CANAL_MAGALU } from "./logic.ts"

const AGORA = "2026-10-21T12:00:00.000Z"
const brl = (centavos: number) => ({ total: centavos, normalizer: 100, currency: "BRL" })

Deno.test("dinheiro: número, string e objeto com normalizer", () => {
  assertEquals(dinheiro(12.5), 12.5)
  assertEquals(dinheiro("12,50"), 12.5)
  assertEquals(dinheiro({ value: 1290, normalizer: 100 }), 12.9)
  assertEquals(dinheiro({ total: 1290, normalizer: 1000 }), 1.29)
})

Deno.test("dinheiro: ilegível ou sem normalizer vira null, nunca zero", () => {
  assertEquals(dinheiro(undefined), null)
  assertEquals(dinheiro("abc"), null)
  assertEquals(dinheiro({ currency: "BRL" }), null)
  assertEquals(dinheiro({ amount: 7 }), null)
})

Deno.test("mapSku: formato da spec, sem preço/estoque na lista", () => {
  const item = { sku: "ABC", title: "Panela", status: "PUBLISHED", images: [{ reference: "https://img/1.jpg" }] }
  const linha = mapSku("t1", item, AGORA)!
  assertEquals(linha.sku, "ABC")
  assertEquals(linha.status, "PUBLISHED")
  assertEquals(linha.image_url, "https://img/1.jpg")
  assertEquals("price" in linha, false)
  assertEquals(linha.payload, item)
  assertEquals(mapSku("t1", { title: "x" }, AGORA), null)
})

Deno.test("precoDaResposta: canal Magalu e normalizer", () => {
  const body = { results: [
    { channel: { id: "outro" }, price: 100, list_price: 100, normalizer: 100 },
    { channel: { id: CANAL_MAGALU }, price: 9990, list_price: 12990, normalizer: 100 },
  ] }
  assertEquals(precoDaResposta(body), { price: 99.9, list_price: 129.9 })
  assertEquals(precoDaResposta({ results: [] }), null)
  assertEquals(precoDaResposta({ results: [{ channel: { id: "x" }, price: 1, normalizer: 100 }, { channel: { id: "y" }, price: 2, normalizer: 100 }] }), null)
})

Deno.test("estoqueDaResposta: soma AVAILABLE, ignora RESERVED, vazio é null", () => {
  const body = { results: [
    { channel: { id: CANAL_MAGALU }, type: "AVAILABLE", quantity: 3, branch: { id: "cd1" } },
    { channel: { id: CANAL_MAGALU }, type: "AVAILABLE", quantity: 2, branch: { id: "cd2" } },
    { channel: { id: CANAL_MAGALU }, type: "RESERVED", quantity: 9 },
  ] }
  assertEquals(estoqueDaResposta(body), 5)
  assertEquals(estoqueDaResposta({ results: [] }), null)
  assertEquals(estoqueDaResposta({ results: [{ type: "AVAILABLE", quantity: 0 }] }), 0)
})

Deno.test("mapPedido: centavos com normalizer e id como chave", () => {
  const p = mapPedido("t1", {
    id: "uuid-1", code: "LU-123", status: "approved", purchased_at: "2026-10-20T10:00:00+00:00",
    amounts: { total: 15990, normalizer: 100, currency: "BRL" },
    deliveries: [{ status: "approved", amounts: brl(15990), items: [{}, {}] }],
  }, AGORA)!
  assertEquals(p.order_id, "uuid-1")
  assertEquals(p.total_amount, 159.9)
  assertEquals(p.items_count, 2)
  assertEquals(p.purchased_at, "2026-10-20T10:00:00.000Z")
})

Deno.test("mapPedido: cancelamento parcial soma só as entregas ativas", () => {
  const base = { id: "u2", status: "finished", amounts: { total: 30000, normalizer: 100 } }
  const parcial = mapPedido("t1", { ...base, deliveries: [
    { status: "delivered", amounts: brl(10000), items: [{}] },
    { status: "cancelled", amounts: brl(20000), items: [{}] },
  ] }, AGORA)!
  assertEquals(parcial.total_amount, 100)
  const ilegivel = mapPedido("t1", { ...base, deliveries: [
    { status: "delivered", amounts: { total: 10000 } },
    { status: "cancelled", amounts: brl(20000) },
  ] }, AGORA)!
  assertEquals(ilegivel.total_amount, null)
})

Deno.test("pedidoContaComoVenda: new e cancelado não contam", () => {
  assertEquals(pedidoContaComoVenda("cancelled"), false)
  assertEquals(pedidoContaComoVenda("new"), false)
  assertEquals(pedidoContaComoVenda(null), false)
  assertEquals(pedidoContaComoVenda("approved"), true)
  assertEquals(pedidoContaComoVenda("finished"), true)
})
