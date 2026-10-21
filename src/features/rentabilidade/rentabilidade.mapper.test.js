import { describe, it, expect } from 'vitest'
import { mapRentabilidade, cascata, diasDoPeriodo } from './rentabilidade.mapper'

const AGORA = '2026-10-21T15:00:00Z'
const cfg = { tax_pct: 10, commission_pct: 20, freight_pct: null }
const ped = (id, quando, itens, status = 'approved') => ({ order_id: id, status, purchased_at: quando, payload: { items: itens } })
const pedidos = [
  ped('1', '2026-10-20T12:00:00Z', [{ sku: 'A', quantity: 2, total: 200 }]),
  ped('2', '2026-10-21T12:00:00Z', [{ sku: 'B', quantity: 1, total: 100 }]),
  ped('3', '2026-10-21T13:00:00Z', [{ sku: 'B', quantity: 1, total: 100 }], 'cancelled'),
]

describe('mapRentabilidade', () => {
  it('lucro completo quando todo custo e taxa são conhecidos', () => {
    const vm = mapRentabilidade({ pedidos, custos: new Map([['A', 50], ['B', 30]]), cfg, podeVerValores: true, dias: 7, agora: AGORA })
    expect(vm.dre.receita).toBe(300)
    expect(vm.dre.lucro).toBeCloseTo(300 - 60 - 130 - 30)
    expect(vm.dre.semFrete).toBe(true)
    expect(vm.diario).toHaveLength(7)
    expect(vm.diario.at(-1).dia).toBe('2026-10-21')
    expect(vm.diario.at(-1).lucro).toBeCloseTo(100 - 20 - 30 - 10)
    expect(vm.composicao.map((c) => c.chave)).toEqual(['custo', 'comissao', 'imposto', 'lucro'])
  })
  it('custo faltando: lucro indisponível com o motivo e cobertura', () => {
    const vm = mapRentabilidade({ pedidos, custos: new Map([['A', 50]]), cfg, podeVerValores: true, dias: 7, agora: AGORA })
    expect(vm.dre.lucro).toBeNull()
    expect(vm.dre.faltando).toContain('custo de 1 SKU(s)')
    expect(vm.dre.cobertura).toEqual({ skusVendidos: 2, skusComCusto: 1, pctReceita: (200 / 300) * 100 })
    expect(vm.dre.custoParcial).toBe(true)
    expect(vm.diario.every((d) => d.lucro === null)).toBe(true)
    expect(vm.composicao).toEqual([])
  })
  it('pedido sem itens legíveis impede o lucro', () => {
    const vm = mapRentabilidade({ pedidos: [...pedidos, ped('4', '2026-10-21T10:00:00Z', [])], custos: new Map([['A', 50], ['B', 30]]), cfg, podeVerValores: true, dias: 7, agora: AGORA })
    expect(vm.dre.lucro).toBeNull()
    expect(vm.dre.faltando).toContain('1 pedido(s) sem itens legíveis')
  })
  it('sem acesso nada de custo aparece', () => {
    const vm = mapRentabilidade({ pedidos, custos: new Map(), cfg: null, podeVerValores: false, dias: 7, agora: AGORA })
    expect(vm.dre.receita).toBe(300)
    expect(vm.dre.comissao).toBeNull()
    expect(vm.dre.cobertura.skusComCusto).toBeNull()
  })
  it('sem vendas a receita é nula', () => {
    expect(mapRentabilidade({ pedidos: [], custos: new Map(), cfg, podeVerValores: true, dias: 7, agora: AGORA }).dre.receita).toBeNull()
  })
})

describe('cascata', () => {
  it('barra flutuante só até o primeiro componente desconhecido', () => {
    const c = cascata({ receita: 100, comissao: 20, custo: null, frete: null, imposto: 10, lucro: null, semFrete: true })
    expect(c.find((s) => s.chave === 'comissao').base).toBe(80)
    expect(c.find((s) => s.chave === 'custo').base).toBeNull()
    expect(c.find((s) => s.chave === 'imposto').base).toBeNull()
  })
})

describe('diasDoPeriodo', () => {
  it('termina hoje em Brasília', () => {
    expect(diasDoPeriodo(3, '2026-10-21T02:00:00Z')).toEqual(['2026-10-18', '2026-10-19', '2026-10-20'])
  })
})
