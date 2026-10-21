import { describe, it, expect } from 'vitest'
import { mapPrevisoes, indicesSemana, backtest, tendencia7, montarSeries, diasFuturos, nivelBase } from './previsoes.mapper'
import { listaDias } from '../relatorios/relatorios.mapper'

const agora = new Date('2026-10-21T15:00:00Z')
const dias90 = listaDias(90, agora, 1)

/** Pedido às 12h BRT do dia, com um item. */
const ped = (dia, sku, quantity, status = 'approved') => ({
  order_id: `${dia}-${sku}`, status, purchased_at: `${dia}T15:00:00Z`, payload: { items: [{ sku, name: `Prod ${sku}`, quantity }] },
})

describe('previsoes.mapper', () => {
  it('base termina ontem e projeção começa hoje', () => {
    expect(dias90[89]).toBe('2026-10-20')
    expect(diasFuturos(2, agora)).toEqual(['2026-10-21', '2026-10-22'])
  })

  it('sem vendas: semBase e nada inventado', () => {
    const vm = mapPrevisoes({ pedidos: [], horizonte: 7, agora })
    expect(vm.semBase).toBe(true)
    expect(vm.kpis.projecao).toBeNull()
    expect(vm.kpis.acuracia).toBeNull()
  })

  it('série constante projeta a mesma média e acerta o backtest', () => {
    const pedidos = dias90.map((d) => ped(d, 'A', 2))
    const vm = mapPrevisoes({ pedidos, horizonte: 7, agora })
    expect(vm.kpis.mediaDiaria).toBe(2)
    expect(vm.kpis.projecao.provavel).toBeCloseTo(14, 6)
    expect(vm.kpis.projecao.conservador).toBeCloseTo(14, 6)
    expect(vm.kpis.acuracia.mape).toBeCloseTo(0, 6)
    expect(vm.skus[0]).toMatchObject({ sku: 'A', unidades90: 180, tendencia: 0 })
  })

  it('índices de dia da semana captam o dia forte', () => {
    const serie = dias90.map((d) => (new Date(`${d}T12:00:00Z`).getUTCDay() === 1 ? 10 : 1))
    const idx = indicesSemana(serie, dias90)
    expect(idx[1]).toBeGreaterThan(2)
    expect(idx[3]).toBeLessThan(1)
    expect(nivelBase(serie, dias90, idx)).toBeGreaterThan(0)
  })

  it('quantidade ausente é desconhecida e declarada, cancelado não conta', () => {
    const s = montarSeries([ped(dias90[0], 'A', null), ped(dias90[1], 'A', 3, 'canceled'), { status: 'approved', purchased_at: `${dias90[2]}T15:00:00Z`, payload: {} }], dias90)
    expect(s.itensSemQtd).toBe(1)
    expect(s.pedidosSemItens).toBe(1)
    expect(s.total.reduce((a, v) => a + v, 0)).toBe(0)
  })

  it('backtest sem dias com venda suficientes é null', () => {
    const serie = Array(90).fill(0)
    serie[10] = 5
    expect(backtest(serie, dias90)).toBeNull()
  })

  it('tendência 7d sem base é null', () => {
    expect(tendencia7([...Array(7).fill(0), ...Array(7).fill(1)])).toBeNull()
    expect(tendencia7([...Array(7).fill(1), ...Array(7).fill(2)])).toBe(100)
  })
})
