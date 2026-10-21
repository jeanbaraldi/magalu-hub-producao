import { assertEquals } from "jsr:@std/assert@1"
import { contaPedida, negarLoja, TODAS, filtrarLojas, lerLojas, lojaPermitida, respostaLojaNegada, type Lojas } from "./hub-lojas.ts"

const rpcDe = (respostas: Record<string, { data: unknown; error: unknown }>) =>
  (fn: string) => Promise.resolve(respostas[fn] ?? { data: null, error: { message: "ausente" } })

Deno.test("lerLojas: todas", async () => {
  assertEquals(await lerLojas(rpcDe({ sem_filtro_de_loja: { data: true, error: null } })), { todas: true })
})

Deno.test("lerLojas: só estas, contas viram texto", async () => {
  const l = await lerLojas(rpcDe({
    sem_filtro_de_loja: { data: false, error: null },
    minhas_lojas: { data: ["111", 222], error: null },
  }))
  assertEquals(l, { todas: false, contas: ["111", "222"] })
})

Deno.test("lerLojas: falha nunca libera", async () => {
  assertEquals(await lerLojas(rpcDe({})), null)
  assertEquals(await lerLojas(rpcDe({ sem_filtro_de_loja: { data: "true", error: null } })), null)
  assertEquals(await lerLojas(rpcDe({ sem_filtro_de_loja: { data: false, error: null } })), null)
  assertEquals(await lerLojas(rpcDe({
    sem_filtro_de_loja: { data: false, error: null },
    minhas_lojas: { data: null, error: { code: "PGRST202" } },
  })), null)
  assertEquals(await lerLojas(() => Promise.reject(new Error("rede"))), null)
})

Deno.test("lojaPermitida", () => {
  const so111: Lojas = { todas: false, contas: ["111"] }
  assertEquals(lojaPermitida(so111, "111"), true)
  assertEquals(lojaPermitida(so111, 111), true)
  assertEquals(lojaPermitida(so111, "222"), false)
  assertEquals(lojaPermitida(so111, ""), false)
  assertEquals(lojaPermitida(so111, null), false)
  assertEquals(lojaPermitida({ todas: true }, "999"), true)
  assertEquals(lojaPermitida({ todas: true }, ""), false)
  assertEquals(lojaPermitida(null, "111"), false)
  assertEquals(lojaPermitida({ todas: false, contas: [] }, "111"), false)
})

Deno.test("filtrarLojas", () => {
  const sellers = [{ seller_id: "111" }, { seller_id: "222" }]
  assertEquals(filtrarLojas({ todas: false, contas: ["222"] }, sellers, (s) => s.seller_id), [{ seller_id: "222" }])
  assertEquals(filtrarLojas({ todas: true }, sellers, (s) => s.seller_id), sellers)
  assertEquals(filtrarLojas(null, sellers, (s) => s.seller_id), [])
  assertEquals(filtrarLojas({ todas: false, contas: ["111"] }, ["111", "222"]), ["111"])
})

Deno.test("respostaLojaNegada: 403 com CORS", async () => {
  const r = respostaLojaNegada({ "Access-Control-Allow-Origin": "*" })
  assertEquals(r.status, 403)
  assertEquals(r.headers.get("Access-Control-Allow-Origin"), "*")
  assertEquals((await r.json()).error, "loja_nao_liberada")
})

Deno.test("contaPedida", () => {
  const so: Lojas = { todas: false, contas: ["222", "111"] }
  assertEquals(contaPedida(so, "111"), { sellerId: "111" })
  assertEquals(contaPedida(so, "999"), false)
  assertEquals(contaPedida(so, null), { sellerId: "222" })
  assertEquals(contaPedida({ todas: true }, null), { sellerId: null })
  assertEquals(contaPedida({ todas: true }, "999"), { sellerId: "999" })
  assertEquals(contaPedida({ todas: false, contas: [] }, null), false)
  assertEquals(contaPedida(null, "111"), false)
})

Deno.test("negarLoja", () => {
  const so: Lojas = { todas: false, contas: ["111"] }
  assertEquals(negarLoja(null), true)
  assertEquals(negarLoja(null, "111"), true)
  assertEquals(negarLoja(so), false)
  assertEquals(negarLoja(so, ""), false)
  assertEquals(negarLoja(so, "111"), false)
  assertEquals(negarLoja(so, 111), false)
  assertEquals(negarLoja(so, "222"), true)
  assertEquals(negarLoja(TODAS, "222"), false)
})
