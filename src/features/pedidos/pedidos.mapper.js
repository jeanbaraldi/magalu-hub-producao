import { STATUS_LABELS } from './pedidos.constants'
import { pedidoContaComoVenda, pedidoCancelado, somarReceita } from '../magalu/vendas'

function titleCase(s) {
  return String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function statusInfo(status) {
  if (!status) return { label: 'Sem status', tone: 'slate' }
  return STATUS_LABELS[String(status).toLowerCase()] ?? { label: titleCase(status), tone: 'slate' }
}

/** Primeiro item do pedido, lido do payload cru com caminhos tolerantes. */
function primeiroItem(payload) {
  const itens = payload?.items ?? payload?.order_items ?? payload?.products ?? payload?.deliveries?.[0]?.items ?? []
  const it = Array.isArray(itens) ? itens[0] : null
  if (!it) return null
  const info = it.info ?? it.product ?? it.sku ?? it
  return {
    titulo: info?.name ?? info?.title ?? it?.name ?? it?.title ?? null,
    sku: info?.id ?? info?.sku ?? it?.sku ?? null,
  }
}

export function mapPedidoRow(r) {
  return {
    id: String(r.order_id),
    status: r.status,
    statusInfo: statusInfo(r.status),
    venda: pedidoContaComoVenda(r.status),
    cancelado: pedidoCancelado(r.status),
    compradoEm: r.purchased_at,
    total: r.total_amount == null ? null : Number(r.total_amount),
    itens: r.items_count,
    primeiroItem: primeiroItem(r.payload),
  }
}

export function filtrarPedidos(rows, { status = 'todos', busca = '' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (status === 'vendas' && !r.venda) return false
    if (status === 'cancelados' && !r.cancelado) return false
    if (!q) return true
    return r.id.toLowerCase().includes(q)
      || (r.primeiroItem?.titulo ?? '').toLowerCase().includes(q)
      || String(r.primeiroItem?.sku ?? '').toLowerCase().includes(q)
  })
}

/** KPIs sobre o PERÍODO inteiro, nunca sobre a lista filtrada. */
export function mapPedidosKpis(rows) {
  const vendas = rows.filter((r) => r.venda)
  const receita = somarReceita(vendas.map((r) => ({ total_amount: r.total })))
  return {
    pedidos: vendas.length,
    receita: receita.total,
    semValor: receita.semValor,
    ticket: receita.total != null && receita.conhecidos > 0 ? receita.total / receita.conhecidos : null,
    cancelados: rows.filter((r) => r.cancelado).length,
    total: rows.length,
  }
}
