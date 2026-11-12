import { assertEquals } from "jsr:@std/assert@1"
import {
  conversaAguardaLoja, corpoResposta, dataMagalu, mapConversa, mapMensagemConversa, mapMensagemProtocolo,
  mapPergunta, mapProtocolo, protocoloAguardaLoja, temEscopo,
} from "./logic.ts"

const AGORA = "2026-11-12T16:00:00.000Z"

Deno.test("dataMagalu: sem fuso é UTC; com Z mantém; lixo vira null", () => {
  assertEquals(dataMagalu("2026-11-11T11:00:00"), "2026-11-11T11:00:00.000Z")
  assertEquals(dataMagalu("2026-11-09T10:54:47.637Z"), "2026-11-09T10:54:47.637Z")
  assertEquals(dataMagalu("2026-11-12T09:51:06.871000"), "2026-11-12T09:51:06.871Z")
  assertEquals(dataMagalu(""), null)
  assertEquals(dataMagalu("x"), null)
  assertEquals(dataMagalu(null), null)
})

Deno.test("mapPergunta: formato medido; sem id é descartada", () => {
  const q = {
    id: "6aea35d9", status: "WAITING_RESPONSE",
    subject: { id: "khh5", type: "product", extra: { name: "Fogão 2 bocas", url: "https://x/p", url_img: "https://x/i.jpg" } },
    question: { message: "É duas bocas?", owner: { name: "Nelson" }, when_at: "2026-11-03T19:28:25.281Z", product: { sku: "7980" } },
  }
  const l = mapPergunta("A1", q, AGORA)!
  assertEquals([l.id, l.status, l.sku, l.product_name, l.question_text, l.asker_name, l.asked_at, l.answer_text],
    ["6aea35d9", "WAITING_RESPONSE", "7980", "Fogão 2 bocas", "É duas bocas?", "Nelson", "2026-11-03T19:28:25.281Z", null])
  assertEquals(mapPergunta("A1", { status: "X" }, AGORA), null)
})

Deno.test("mapProtocolo: prazo sem fuso vira UTC, itens do pedido, fechado preservado", () => {
  const t = {
    id: "e41b", protocol: "2026111010094382", type: "cancellation", reason: "quality_concern", origin: "customer",
    status: "waiting_seller", closed: false, due_date: "2026-11-11T11:00:00", created_at: "2026-11-10T10:09:18",
    updated_at: "2026-11-10T10:09:35.625000",
    order: { id: "ad8d", code: "1583970110546120", delivery: { items: [{ sku: "6373", quantity: 1 }] } },
  }
  const l = mapProtocolo("A1", t, AGORA)!
  assertEquals([l.status, l.closed, l.due_date, l.order_code, l.items?.length], ["waiting_seller", false, "2026-11-11T11:00:00.000Z", "1583970110546120", 1])
  assertEquals(mapProtocolo("A1", { ...t, closed: undefined }, AGORA)!.closed, null)
  assertEquals(protocoloAguardaLoja("waiting_seller"), true)
  assertEquals(protocoloAguardaLoja("waiting_customer"), false)
  assertEquals(protocoloAguardaLoja(null), false)
})

Deno.test("mapMensagemProtocolo: remetente e destino", () => {
  const m = { id: "8d8b", message: "Oi", destination: "customer", created_at: "2026-11-12T09:51:03", sender: { type: "channel", name: "magalu" }, moderation: { status: "not-moderated" }, attachments: [] }
  const l = mapMensagemProtocolo("A1", "T1", m, AGORA)!
  assertEquals([l.sender_type, l.destination, l.sent_at, l.moderation_status], ["channel", "customer", "2026-11-12T09:51:03.000Z", "not-moderated"])
})

Deno.test("mapConversa + aguarda loja: cliente falou por último numa conversa aberta", () => {
  const c = {
    id: "6af0", status: "OPENED", unread_from_count: 1, last_interaction_at: "2026-11-09T10:54:48.630Z",
    from_user: { full_name: "Maiko", ref_key: "e66c", type: "CUSTOMER" },
    last_message: { content: "Bom dia", user: { type: "SELLER" } },
  }
  const l = mapConversa("A1", c, AGORA)!
  assertEquals([l.customer_name, l.unread_from_count, l.last_from_type], ["Maiko", 1, "SELLER"])
  assertEquals(conversaAguardaLoja(l), false)
  assertEquals(conversaAguardaLoja({ status: "OPENED", last_from_type: "CUSTOMER" }), true)
  assertEquals(conversaAguardaLoja({ status: "CLOSED", last_from_type: "CUSTOMER" }), false)
  assertEquals(conversaAguardaLoja({ status: "OPENED", last_from_type: null }), false)
  assertEquals(mapConversa("A1", { ...c, unread_from_count: "x" }, AGORA)!.unread_from_count, null)
})

Deno.test("mapMensagemConversa: mensagem da loja vem só com to_user SELLER", () => {
  const daLoja = { id: "m1", from_user: null, to_user: { type: "SELLER", full_name: "atendente@x" }, content: "Bom dia", when_at: "2026-11-09T10:54:47.637Z", moderation: { status: "APPROVED" } }
  const doCliente = { id: "m2", from_user: { type: "CUSTOMER", full_name: "Maiko" }, to_user: null, content: "bloqueada", moderation: { status: "REJECTED" } }
  assertEquals(mapMensagemConversa("A1", "C1", daLoja, AGORA)!.from_type, "SELLER")
  const l = mapMensagemConversa("A1", "C1", doCliente, AGORA)!
  assertEquals([l.from_type, l.from_name, l.moderation_status, l.sent_at], ["CUSTOMER", "Maiko", "REJECTED", null])
  assertEquals(mapMensagemConversa("A1", "C1", { id: "m3" }, AGORA)!.from_type, null)
})

Deno.test("escopo e corpo da resposta por tipo", () => {
  assertEquals(temEscopo("a services:questions-seller:read b", "pergunta"), false)
  assertEquals(temEscopo("services:questions-seller:write", "pergunta"), true)
  assertEquals(temEscopo(null, "conversa"), false)
  const autor = { nome: "Loja", codigo: "hub" }
  assertEquals(corpoResposta("pergunta", "oi", autor), { message: "oi", owner: { name: "Loja", external_id: "hub" } })
  assertEquals(corpoResposta("protocolo", "oi", autor), { message: "oi", destination: "customer", owner: { name: "Loja", code: "hub" } })
  assertEquals(corpoResposta("conversa", "oi", autor), { content: "oi", owner: { name: "Loja", external_id: "hub" } })
})
