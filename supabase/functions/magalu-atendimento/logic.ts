// Regras puras do atendimento da Magalu (perguntas, SAC e conversas). Testadas em logic.test.ts.
//
// Medido em 12/11/2026 com os tokens das lojas conectadas:
//   - perguntas: { id, status, subject{ id, type, extra{ name, url, url_img } },
//     question{ message, owner{ name }, when_at, product{ sku } }, answer? }
//   - protocolos: datas SEM fuso ("2026-11-12T09:51:03"). Gravadas como UTC: os prazos
//     vêm redondos às 11:00, que é 08:00 de Brasília.
//   - conversas: last_message.user.type CUSTOMER|SELLER; mensagens têm from_user OU to_user.

/** Data da API (com ou sem fuso) em ISO; null quando ilegível. Sem fuso = UTC. */
export function dataMagalu(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null
  const s = v.trim()
  const comFuso = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}Z`
  const ms = Date.parse(comFuso)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null
}

const txt = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null)
const obj = (v: unknown): Record<string, any> => (v && typeof v === "object" ? v as Record<string, any> : {})

/** Tira as tags HTML de um texto (a descrição do produto vem em HTML). */
export function semHtml(v: unknown): string | null {
  const s = txt(v)
  return s ? s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null
}

export function mapPergunta(accountId: string, q: unknown, agora: string) {
  const p = obj(q)
  const id = txt(p.id)
  if (!id) return null
  const pergunta = obj(p.question)
  const assunto = obj(p.subject)
  const extra = obj(assunto.extra)
  const resposta = obj(p.answer)
  return {
    account_id: accountId,
    id,
    status: txt(p.status),
    sku: txt(obj(pergunta.product).sku),
    product_name: txt(extra.name),
    product_url: txt(extra.url),
    product_img: txt(extra.url_img),
    question_text: txt(pergunta.message),
    asker_name: txt(obj(pergunta.owner).name),
    asked_at: dataMagalu(pergunta.when_at),
    answer_text: txt(resposta.message),
    answered_at: dataMagalu(resposta.when_at),
    payload: p,
    synced_at: agora,
  }
}

export function mapProtocolo(accountId: string, t: unknown, agora: string) {
  const p = obj(t)
  const id = txt(p.id)
  if (!id) return null
  const pedido = obj(p.order)
  return {
    account_id: accountId,
    id,
    protocol: txt(p.protocol),
    type: txt(p.type),
    reason: txt(p.reason),
    origin: txt(p.origin),
    status: txt(p.status),
    closed: typeof p.closed === "boolean" ? p.closed : null,
    due_date: dataMagalu(p.due_date),
    order_id: txt(pedido.id),
    order_code: txt(pedido.code),
    items: Array.isArray(obj(pedido.delivery).items) ? obj(pedido.delivery).items : null,
    created_at_ml: dataMagalu(p.created_at),
    updated_at_ml: dataMagalu(p.updated_at),
    payload: p,
    synced_at: agora,
  }
}

export function mapMensagemProtocolo(accountId: string, ticketId: string, m: unknown, agora: string) {
  const p = obj(m)
  const id = txt(p.id)
  if (!id) return null
  const remetente = obj(p.sender)
  return {
    account_id: accountId,
    ticket_id: ticketId,
    id,
    sender_type: txt(remetente.type),
    sender_name: txt(remetente.name),
    destination: txt(p.destination),
    message: txt(p.message),
    sent_at: dataMagalu(p.created_at),
    moderation_status: txt(obj(p.moderation).status),
    attachments: Array.isArray(p.attachments) ? p.attachments : null,
    payload: p,
    synced_at: agora,
  }
}

export function mapConversa(accountId: string, c: unknown, agora: string) {
  const p = obj(c)
  const id = txt(p.id)
  if (!id) return null
  const cliente = obj(p.from_user)
  const ultima = obj(p.last_message)
  const naoLidas = Number(p.unread_from_count)
  return {
    account_id: accountId,
    id,
    status: txt(p.status),
    customer_name: txt(cliente.full_name),
    customer_ref: txt(cliente.ref_key),
    unread_from_count: Number.isFinite(naoLidas) ? naoLidas : null,
    last_interaction_at: dataMagalu(p.last_interaction_at),
    last_from_type: txt(obj(ultima.user).type),
    last_message_text: txt(ultima.content),
    payload: p,
    synced_at: agora,
  }
}

export function mapMensagemConversa(accountId: string, conversationId: string, m: unknown, agora: string) {
  const p = obj(m)
  const id = txt(p.id)
  if (!id) return null
  // Quem fala é from_user; mensagem da loja vem só com to_user (o atendente) e from_user nulo.
  const de = obj(p.from_user)
  const para = obj(p.to_user)
  const tipo = txt(de.type) ?? (txt(para.type) === "SELLER" ? "SELLER" : null)
  return {
    account_id: accountId,
    conversation_id: conversationId,
    id,
    from_type: tipo,
    from_name: txt(de.full_name) ?? (tipo === "SELLER" ? txt(para.full_name) : null),
    content: txt(p.content),
    sent_at: dataMagalu(p.when_at),
    moderation_status: txt(obj(p.moderation).status),
    payload: p,
    synced_at: agora,
  }
}

/** Protocolo que está com a loja: só `waiting_seller` pede ação dela. */
export const protocoloAguardaLoja = (status: string | null) => status === "waiting_seller"

/** Conversa aberta em que o cliente falou por último. */
export const conversaAguardaLoja = (c: { status: string | null; last_from_type: string | null }) =>
  c.status === "OPENED" && c.last_from_type === "CUSTOMER"

/** Escopo de escrita que cada resposta exige. Sem ele no token, a Magalu recusa. */
export const ESCOPO_ESCRITA = {
  pergunta: "services:questions-seller:write",
  protocolo: "open:ticket-messages-seller:write",
  conversa: "services:conversations-seller:write",
} as const

export type TipoResposta = keyof typeof ESCOPO_ESCRITA

export function temEscopo(scope: string | null | undefined, tipo: TipoResposta): boolean {
  return (scope ?? "").split(/\s+/).includes(ESCOPO_ESCRITA[tipo])
}

/** Limites das specs: pergunta sem limite declarado (usamos 3000), SAC 3000, conversa 2200. */
export const LIMITE_TEXTO: Record<TipoResposta, number> = { pergunta: 3000, protocolo: 3000, conversa: 2200 }

/** Corpo do POST de cada resposta, conforme a spec. */
export function corpoResposta(tipo: TipoResposta, texto: string, autor: { nome: string; codigo: string }) {
  if (tipo === "pergunta") return { message: texto, owner: { name: autor.nome, external_id: autor.codigo } }
  if (tipo === "protocolo") return { message: texto, destination: "customer", owner: { name: autor.nome, code: autor.codigo } }
  return { content: texto, owner: { name: autor.nome, external_id: autor.codigo } }
}
