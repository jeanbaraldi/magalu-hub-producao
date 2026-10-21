import { describe, it, expect } from 'vitest'
import { itensDoPedido, agregarPorSku, dinheiro } from './itens'

describe('itensDoPedido', () => {
  it('lê items com info/quantity/unit_price e calcula o total', () => {
    const its = itensDoPedido({ items: [{ info: { sku: 'A1', name: 'Panela' }, quantity: 2, unit_price: { value: 1990, normalizer: 100 } }] })
    expect(its).toEqual([{ sku: 'A1', titulo: 'Panela', quantidade: 2, precoUnitario: 19.9, total: 39.8 }])
  })
  it('junta itens de várias entregas', () => {
    const its = itensDoPedido({ deliveries: [{ items: [{ sku: 'A' }] }, { items: [{ sku: 'B' }] }] })
    expect(its.map((i) => i.sku)).toEqual(['A', 'B'])
  })
  it('campo ausente vira null, nunca zero', () => {
    const [it0] = itensDoPedido({ items: [{ sku: 'X' }] })
    expect(it0.quantidade).toBeNull()
    expect(it0.total).toBeNull()
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
  })
})

describe('agregarPorSku', () => {
  const pedidos = [
    { order_id: '1', status: 'approved', payload: { items: [{ sku: 'A', quantity: 1, total: 10 }, { quantity: 1, total: 5 }] } },
    { order_id: '2', status: 'approved', payload: { items: [{ sku: 'A', quantity: 2 }] } },
    { order_id: '3', status: 'cancelled', payload: { items: [{ sku: 'A', quantity: 9, total: 99 }] } },
  ]
  it('soma só vendas, conta itens sem valor e sem SKU', () => {
    const { linhas, semSku } = agregarPorSku(pedidos)
    expect(semSku).toBe(1)
    expect(linhas).toEqual([{ sku: 'A', titulo: null, unidades: 3, receita: 10, itensSemValor: 1, itensSemQtd: 0, pedidos: 2 }])
  })
})
