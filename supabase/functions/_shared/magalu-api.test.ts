import { assertEquals } from "jsr:@std/assert@1"
import { lojaDaRespostaMe } from "./magalu-api.ts"

Deno.test("lojaDaRespostaMe: tenant.id é a loja, seller.name o nome", () => {
  assertEquals(lojaDaRespostaMe({ tenant: { id: "t-1" }, channel: { id: "c" }, seller: { id: "s", name: "Loja X" } }), { id: "t-1", nome: "Loja X" })
  assertEquals(lojaDaRespostaMe({ tenant: { id: "t-2" }, seller: { id: "s" } }), { id: "t-2", nome: "s" })
  assertEquals(lojaDaRespostaMe({ tenant: { id: "t-3" } }), { id: "t-3", nome: null })
  assertEquals(lojaDaRespostaMe({ seller: { id: "s" } }), null)
  assertEquals(lojaDaRespostaMe(null), null)
})
