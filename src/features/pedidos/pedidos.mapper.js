import { STATUS_LABELS } from './pedidos.constants'
import { itensDoPedido } from '../magalu/itens'
import { pedidoContaComoVenda, pedidoCancelado, somarReceita } from '../magalu/vendas'

function titleCase(s) {
  return String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function statusInfo(status) {
  if (!status) return { label: 'Sem status', tone: 'slate' }
  return STATUS_LABELS[String(status).toLowerCase()] ?? { label: titleCase(status), tone: 'slate' }
}

/** Primeiro item do pedido (spec: deliveries[].items[].info.{sku,name}). */
function primeiroItem(payload) {
  const it = itensDoPedido(payload)[0]
  return it ? { titulo: it.titulo, sku: it.sku } : null
}

export function mapPedidoRow(r) {
  return {
    id: String(r.order_id),
    // `code` é o número do pedido que aparece para o comprador e no painel da Magalu.
    codigo: r.payload?.code ? String(r.payload.code) : null,
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
      || (r.codigo ?? '').toLowerCase().includes(q)
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
