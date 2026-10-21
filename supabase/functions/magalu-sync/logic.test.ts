import { assertEquals } from "jsr:@std/assert@1"
import { dinheiro, mapPedido, mapSku, pedidoContaComoVenda } from "./logic.ts"

const AGORA = "2026-10-21T12:00:00.000Z"

Deno.test("dinheiro: número, string e objeto com normalizer", () => {
  assertEquals(dinheiro(12.5), 12.5)
  assertEquals(dinheiro("12,50"), 12.5)
  assertEquals(dinheiro({ value: 1290, normalizer: 100 }), 12.9)
  assertEquals(dinheiro({ amount: 7 }), 7)
})

Deno.test("dinheiro: ilegível vira null, nunca zero", () => {
  assertEquals(dinheiro(undefined), null)
  assertEquals(dinheiro("abc"), null)
  assertEquals(dinheiro({ currency: "BRL" }), null)
})

Deno.test("mapSku: sem identificador não grava", () => {
  assertEquals(mapSku("t1", { title: "x" }, AGORA), null)
})

Deno.test("mapSku: lê campos aninhados e guarda o cru", () => {
  const item = { sku: "ABC", title: "Panela", price: { price: { value: 9990, normalizer: 100 } }, stock: { quantity: 4 } }
  const linha = mapSku("t1", item, AGORA)!
  assertEquals(linha.sku, "ABC")
  assertEquals(linha.price, 99.9)
  assertEquals(linha.stock, 4)
  assertEquals(linha.payload, item)
})

Deno.test("mapPedido: total ilegível fica null e itens contados", () => {
  const p = mapPedido("t1", { id: 55, status: "approved", purchased_at: "2026-10-20T10:00:00Z", items: [{}, {}] }, AGORA)!
  assertEquals(p.order_id, "55")
  assertEquals(p.total_amount, null)
  assertEquals(p.items_count, 2)
  assertEquals(p.purchased_at, "2026-10-20T10:00:00.000Z")
})

Deno.test("pedidoContaComoVenda: cancelado e sem status não contam", () => {
  assertEquals(pedidoContaComoVenda("CANCELLED"), false)
  assertEquals(pedidoContaComoVenda(null), false)
  assertEquals(pedidoContaComoVenda("approved"), true)
})
