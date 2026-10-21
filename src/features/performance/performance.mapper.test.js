import { describe, it, expect } from 'vitest'
import { mapPerformance, tendencia, filtrarPerformance, ordenarPerformance, pedidosNaJanela, montarLinhas } from './performance.mapper'

const AGORA = '2026-10-21T15:00:00Z'
const ped = (id, quando, itens, status = 'approved') => ({ order_id: id, status, purchased_at: quando, payload: { items: itens } })
const cfg = { tax_pct: 10, commission_pct: 16, freight_pct: null }

describe('tendencia', () => {
  it('±10% define subindo/caindo/estável', () => {
    expect(tendencia(120, 100).tipo).toBe('subindo')
    expect(tendencia(85, 100).tipo).toBe('caindo')
    expect(tendencia(105, 100).tipo).toBe('estavel')
  })
  it('sem base anterior é novo, sem venda nenhuma é nulo', () => {
    expect(tendencia(10, null)).toEqual({ tipo: 'novo', pct: null })
    expect(tendencia(0, null)).toEqual({ tipo: null, pct: null })
  })
})

describe('pedidosNaJanela', () => {
  it('filtra [desde, ate) e ignora data ilegível', () => {
    const ps = [ped('1', '2026-10-20T12:00:00Z', []), ped('2', 'lixo', []), ped('3', '2026-10-10T12:00:00Z', [])]
    expect(pedidosNaJanela(ps, '2026-10-15T03:00:00Z').map((p) => p.order_id)).toEqual(['1'])
  })
})

describe('mapPerformance', () => {
  const pedidos = [
    ped('1', '2026-10-20T12:00:00Z', [{ sku: 'A', quantity: 2, total: 100 }]),
    ped('2', '2026-10-10T12:00:00Z', [{ sku: 'A', quantity: 1, total: 50 }]),
    ped('3', '2026-10-19T12:00:00Z', [{ sku: 'B', quantity: 1, total: 20 }]),
    ped('4', '2026-08-01T12:00:00Z', [{ sku: 'C', quantity: 1, total: 999 }]),
  ]
  const custos = new Map([['A', 10]])
  const vm = mapPerformance({ pedidos, skus: [{ sku: 'A', title: 'Panela', image_url: 'x.jpg' }], custos, cfg, podeVerValores: true, dias: 30, agora: AGORA })

  it('agrega o período, junta o catálogo e calcula ticket', () => {
    const a = vm.rows.find((r) => r.sku === 'A')
    expect(a.receita).toBe(150)
    expect(a.unidades).toBe(3)
    expect(a.ticket).toBe(50)
    expect(a.titulo).toBe('Panela')
    expect(vm.rows.some((r) => r.sku === 'C')).toBe(false)
  })
  it('MC só onde há custo; KPI diz quantos ficaram de fora', () => {
    const a = vm.rows.find((r) => r.sku === 'A')
    expect(a.mc).toBeCloseTo(150 - 30 - 24 - 15)
    expect(vm.rows.find((r) => r.sku === 'B').mc).toBeNull()
    expect(vm.kpis.skusSemMc).toBe(1)
    expect(vm.kpis.mcTotal).toBeCloseTo(81)
    expect(vm.kpis.margemMedia).toBeCloseTo(54)
    expect(vm.kpis.receita).toBe(170)
  })
  it('tendência usa os últimos 7 dias contra os 7 anteriores', () => {
    expect(vm.rows.find((r) => r.sku === 'A').tendencia.tipo).toBe('subindo')
  })
  it('sem acesso a valores a MC é nula com motivo', () => {
    const { rows } = montarLinhas(pedidos.slice(0, 1), { custos, cfg, podeVerValores: false })
    expect(rows[0].mc).toBeNull()
    expect(rows[0].faltando[0]).toMatch(/acesso/)
  })
  it('sem vendas a receita é nula, não zero', () => {
    const v = mapPerformance({ pedidos: [], skus: [], custos, cfg, podeVerValores: true, dias: 30, agora: AGORA })
    expect(v.kpis.receita).toBeNull()
    expect(v.kpis.mcTotal).toBeNull()
  })
})

describe('filtro e ordenação', () => {
  const rows = [
    { sku: 'A', titulo: 'Panela', curva: 'A', receita: 10, mc: null, componentes: {} },
    { sku: 'B', titulo: 'Copo', curva: 'B', receita: 30, mc: 5, componentes: {} },
  ]
  it('busca e curva', () => {
    expect(filtrarPerformance(rows, { busca: 'cop' }).map((r) => r.sku)).toEqual(['B'])
    expect(filtrarPerformance(rows, { curva: 'A' }).map((r) => r.sku)).toEqual(['A'])
  })
  it('nulos vão para o fim nas duas direções', () => {
    expect(ordenarPerformance(rows, 'mc', 'asc').map((r) => r.sku)).toEqual(['B', 'A'])
    expect(ordenarPerformance(rows, 'mc', 'desc').map((r) => r.sku)).toEqual(['B', 'A'])
    expect(ordenarPerformance(rows, 'receita', 'desc').map((r) => r.sku)).toEqual(['B', 'A'])
  })
})
