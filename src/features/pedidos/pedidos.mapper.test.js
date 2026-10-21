import { describe, it, expect } from 'vitest'
import { mapPedidoRow, mapPedidosKpis, filtrarPedidos, statusInfo } from './pedidos.mapper'

const r = (id, status, total, payload = {}) => mapPedidoRow({ order_id: id, status, total_amount: total, purchased_at: '2026-10-20T12:00:00Z', items_count: 1, payload })

describe('pedidos.mapper', () => {
  it('status desconhecido aparece como veio', () => {
    expect(statusInfo('em_separacao').label).toBe('Em Separacao')
    expect(statusInfo(null).label).toBe('Sem status')
  })
  it('KPIs ignoram cancelados e não transformam total nulo em zero', () => {
    const rows = [r('1', 'approved', 100), r('2', 'canceled', 50), r('3', 'delivered', null)]
    const k = mapPedidosKpis(rows)
    expect(k.pedidos).toBe(2)
    expect(k.receita).toBe(100)
    expect(k.semValor).toBe(1)
    expect(k.ticket).toBe(100)
    expect(k.cancelados).toBe(1)
  })
  it('sem vendas a receita é nula', () => {
    expect(mapPedidosKpis([r('1', 'canceled', 10)]).receita).toBeNull()
  })
  it('busca por título do primeiro item', () => {
    const rows = [r('1', 'approved', 1, { items: [{ info: { name: 'Panela Inox' } }] }), r('2', 'approved', 1)]
    expect(filtrarPedidos(rows, { busca: 'panela' }).map((x) => x.id)).toEqual(['1'])
    expect(filtrarPedidos(rows, { status: 'cancelados' })).toEqual([])
  })
})
