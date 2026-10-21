import { describe, it, expect } from 'vitest'
import { itensDoPedido, agregarPorSku, dinheiro } from './itens'

const brl = (c) => ({ total: c, normalizer: 100, currency: 'BRL' })
const item = (sku, qtd, centavos, comissao) => ({
  info: { sku, name: `Produto ${sku}` }, quantity: qtd,
  unit_price: { value: centavos, normalizer: 100 },
  amounts: { total: centavos * qtd, normalizer: 100, commission: comissao == null ? undefined : brl(comissao) },
})

describe('itensDoPedido (formato da spec)', () => {
  it('lê deliveries[].items com unit_price e comissão do item', () => {
    const its = itensDoPedido({ deliveries: [{ status: 'approved', items: [item('A1', 2, 1990, 600)] }] })
    expect(its).toEqual([{ sku: 'A1', titulo: 'Produto A1', quantidade: 2, precoUnitario: 19.9, total: 39.8, comissao: 6 }])
  })
  it('ignora a entrega cancelada (cancelamento parcial)', () => {
    const its = itensDoPedido({ deliveries: [
      { status: 'delivered', items: [item('A', 1, 1000)] },
      { status: 'cancelled', items: [item('B', 1, 1000)] },
    ] })
    expect(its.map((i) => i.sku)).toEqual(['A'])
  })
  it('sem unit_price usa amounts do item; sem normalizer é null, nunca zero', () => {
    const [a] = itensDoPedido({ deliveries: [{ items: [{ info: { sku: 'X' }, quantity: 1, amounts: brl(500) }] }] })
    expect(a.total).toBe(5)
    const [b] = itensDoPedido({ deliveries: [{ items: [{ info: { sku: 'Y' }, amounts: { total: 500 } }] }] })
    expect(b.total).toBeNull()
    expect(b.quantidade).toBeNull()
    expect(b.comissao).toBeNull()
  })
  it('payload sem itens devolve lista vazia', () => {
    expect(itensDoPedido({})).toEqual([])
    expect(itensDoPedido(null)).toEqual([])
  })
})

describe('dinheiro', () => {
  it('aceita string com vírgula e rejeita lixo', () => {
    expect(dinheiro('10,5')).toBe(10.5)
    expect(dinheiro('abc')).toBeNull()
    expect(dinheiro({ value: 7 })).toBeNull()
  })
})

describe('agregarPorSku', () => {
  const pedidos = [
    { order_id: '1', status: 'approved', payload: { deliveries: [{ items: [item('A', 1, 1000, 200), { info: {}, quantity: 1 }] }] } },
    { order_id: '2', status: 'finished', payload: { deliveries: [{ items: [{ info: { sku: 'A' }, quantity: 2 }] }] } },
    { order_id: '3', status: 'cancelled', payload: { deliveries: [{ items: [item('A', 9, 1100)] }] } },
    { order_id: '4', status: 'new', payload: { deliveries: [{ items: [item('A', 5, 1000)] }] } },
  ]
  it('soma só vendas, conta itens sem valor, sem comissão e sem SKU', () => {
    const { linhas, semSku } = agregarPorSku(pedidos)
    expect(semSku).toBe(1)
    expect(linhas).toEqual([{ sku: 'A', titulo: 'Produto A', unidades: 3, receita: 10, comissao: 2, itensSemComissao: 1, itensSemValor: 1, itensSemQtd: 0, pedidos: 2 }])
  })
})
