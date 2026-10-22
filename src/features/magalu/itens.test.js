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
    expect(its).toEqual([{ sku: 'A1', titulo: 'Produto A1', quantidade: 2, precoUnitario: 19.9, total: 39.8, comissao: 6, tarifaFixa: null }])
  })
  it('tarifa fixa = comissão do pedido − comissão dos itens, rateada por unidade', () => {
    const its = itensDoPedido({
      amounts: { commission: { type: 'value', ...brl(2700) } },
      deliveries: [{ status: 'shipped', items: [item('A', 2, 10000, 1200), item('B', 1, 5000, 400)] }],
    })
    // 27,00 − (12,00 + 4,00) = 11,00 em 3 unidades → 3,666… por unidade
    expect(its[0].tarifaFixa).toBeCloseTo(22 / 3)
    expect(its[1].tarifaFixa).toBeCloseTo(11 / 3)
  })
  it('tarifa desconhecida com entrega cancelada, item sem comissão ou diferença negativa', () => {
    const com = { amounts: { commission: brl(1000) } }
    expect(itensDoPedido({ ...com, deliveries: [{ status: 'shipped', items: [item('A', 1, 1000, 500)] }, { status: 'cancelled', items: [item('B', 1, 1000, 500)] }] })[0].tarifaFixa).toBeNull()
    expect(itensDoPedido({ ...com, deliveries: [{ items: [item('A', 1, 1000)] }] })[0].tarifaFixa).toBeNull()
    expect(itensDoPedido({ amounts: { commission: brl(100) }, deliveries: [{ items: [item('A', 1, 1000, 500)] }] })[0].tarifaFixa).toBeNull()
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
    // Sem amounts.commission no pedido a tarifa fixa é desconhecida: comissão incompleta.
    expect(linhas).toEqual([{ sku: 'A', titulo: 'Produto A', unidades: 3, receita: 10, comissao: 0, tarifaFixa: 0, unidadesComTarifa: 0, itensSemComissao: 2, itensSemValor: 1, itensSemQtd: 0, pedidos: 2 }])
  })
  it('comissão por SKU soma percentual + tarifa fixa', () => {
    const { linhas } = agregarPorSku([
      { order_id: '1', status: 'finished', payload: { amounts: { commission: brl(1700) }, deliveries: [{ items: [item('A', 2, 5000, 1200)] }] } },
    ])
    expect(linhas[0]).toMatchObject({ comissao: 17, tarifaFixa: 5, unidadesComTarifa: 2, itensSemComissao: 0 })
  })
})
