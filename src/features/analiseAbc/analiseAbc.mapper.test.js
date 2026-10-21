import { describe, it, expect } from 'vitest'
import { mapAnaliseAbc, classificar, movimento, filtrarAbc, valorDaMetrica } from './analiseAbc.mapper'

const AGORA = '2026-10-21T15:00:00Z'
const ped = (id, quando, itens) => ({ order_id: id, status: 'approved', purchased_at: quando, payload: { items: itens } })

describe('valorDaMetrica', () => {
  it('sem nenhum dado vira null, nunca zero', () => {
    expect(valorDaMetrica({ receita: 0, itensSemValor: 2, unidades: 1, itensSemQtd: 0 }, 'receita')).toBeNull()
    expect(valorDaMetrica({ receita: 0, itensSemValor: 0, unidades: 0, itensSemQtd: 1 }, 'unidades')).toBeNull()
  })
})

describe('classificar', () => {
  it('acumulado na ordem da curva e quem cruza 80% ainda é A e quem cruza 95% ainda é B', () => {
    const r = classificar([
      { sku: 'a', receita: 70, unidades: 1, itensSemValor: 0, itensSemQtd: 0 },
      { sku: 'b', receita: 20, unidades: 1, itensSemValor: 0, itensSemQtd: 0 },
      { sku: 'c', receita: 10, unidades: 5, itensSemValor: 0, itensSemQtd: 0 },
    ], 'receita')
    expect(r.map((l) => l.curva)).toEqual(['A', 'A', 'B'])
    expect(r.map((l) => Math.round(l.acumulado))).toEqual([70, 90, 100])
  })
})

describe('movimento', () => {
  it('compara as classes', () => {
    expect(movimento('A', 'B')).toBe('subiu')
    expect(movimento('C', 'A')).toBe('desceu')
    expect(movimento('B', 'B')).toBe('manteve')
    expect(movimento('B', null)).toBe('novo')
    expect(movimento(null, 'A')).toBeNull()
  })
})

describe('mapAnaliseAbc', () => {
  const pedidos = [
    ped('1', '2026-10-20T12:00:00Z', [{ sku: 'A', quantity: 1, total: 90 }, { sku: 'B', quantity: 10, total: 10 }]),
    ped('2', '2026-09-10T12:00:00Z', [{ sku: 'A', quantity: 1, total: 5 }, { sku: 'B', quantity: 1, total: 95 }, { sku: 'X', quantity: 1, total: 50 }]),
  ]
  it('compara com o período anterior e conta quem saiu', () => {
    const vm = mapAnaliseAbc({ pedidos, skus: [], dias: 30, agora: AGORA, metrica: 'receita' })
    expect(vm.rows.find((r) => r.sku === 'A').movimento).toBe('subiu')
    expect(vm.rows.find((r) => r.sku === 'B').movimento).toBe('desceu')
    expect(vm.resumo.saiu).toBe(1)
    expect(vm.composicao.find((c) => c.curva === 'A').pctValor).toBeCloseTo(90)
  })
  it('por unidades a curva muda', () => {
    const vm = mapAnaliseAbc({ pedidos, skus: [], dias: 30, agora: AGORA, metrica: 'unidades' })
    expect(vm.rows[0].sku).toBe('B')
  })
  it('sem vendas o total é nulo', () => {
    expect(mapAnaliseAbc({ pedidos: [], skus: [], dias: 30, agora: AGORA }).resumo.total).toBeNull()
  })
  it('filtrar não reclassifica', () => {
    const vm = mapAnaliseAbc({ pedidos, skus: [], dias: 30, agora: AGORA })
    const f = filtrarAbc(vm.rows, { busca: 'b' })
    expect(f).toHaveLength(1)
    expect(f[0].curva).toBe(vm.rows.find((r) => r.sku === 'B').curva)
  })
})
