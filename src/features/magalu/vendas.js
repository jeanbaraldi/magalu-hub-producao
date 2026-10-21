/**
 * Regras puras de venda da Magalu, compartilhadas por Dashboard e Pedidos.
 * Espelho de `pedidoContaComoVenda` em supabase/functions/magalu-sync/logic.ts:
 * mexeu num, mexa no outro.
 */

// Status do pedido (spec orders.openapi.yaml): new (pagamento não aprovado), approved,
// cancelled (todas as entregas canceladas), finished. `new` ainda não é venda.
// Status nulo nunca conta como venda (não sabemos o que é).
const NAO_VENDA = new Set(['new', 'cancelled', 'canceled', 'cancelado', 'unpaid', 'not_paid', 'nao_pago', 'pending_payment'])

export function pedidoContaComoVenda(status) {
  return !!status && !NAO_VENDA.has(String(status).toLowerCase())
}

export function pedidoCancelado(status) {
  const s = String(status ?? '').toLowerCase()
  return s === 'cancelled' || s === 'canceled' || s === 'cancelado'
}

/** Dia em Brasília (YYYY-MM-DD). Fronteira de dia sempre BRT, nunca UTC. */
const FMT_DIA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
export function diaBrt(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return FMT_DIA.format(d)
}

/** Início do período: meia-noite BRT de `dias` atrás (inclui hoje). */
export function inicioDoPeriodo(dias, agora = new Date()) {
  const hoje = diaBrt(agora.toISOString())
  const [a, m, d] = hoje.split('-').map(Number)
  // 03:00 UTC = 00:00 BRT (sem horário de verão desde 2019)
  return new Date(Date.UTC(a, m - 1, d - (dias - 1), 3, 0, 0)).toISOString()
}

/**
 * Soma estrita: qualquer valor nulo deixa a receita PARCIAL. Devolve o total do
 * que se sabe + quantos ficaram de fora, nunca trata ausência como zero.
 */
export function somarReceita(pedidos) {
  let total = 0
  let conhecidos = 0
  let semValor = 0
  for (const p of pedidos) {
    if (p.total_amount == null || !Number.isFinite(Number(p.total_amount))) semValor++
    else { total += Number(p.total_amount); conhecidos++ }
  }
  return { total: conhecidos > 0 ? total : null, conhecidos, semValor }
}
