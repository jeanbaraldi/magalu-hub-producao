import { describe, it, expect } from 'vitest'
import { payloadSpec } from '../magalu/specFixture'
import { mapLucratividade, filtrarLucratividade, faixaDe } from './lucratividade.mapper'

const AGORA = '2026-10-21T15:00:00Z'
const cfg = { tax_pct: 0, commission_pct: 0, freight_pct: null }
const pedidos = [{
  order_id: '1', status: 'approved', purchased_at: '2026-10-20T12:00:00Z',
  payload: payloadSpec([
    { sku: 'A', quantity: 1, total: 100 },
    { sku: 'B', quantity: 1, total: 300 },
    { sku: 'C', quantity: 1, total: 50 },
    { sku: 'D', quantity: 1, total: 80 },
  ]),
}]
const custos = new Map([['A', 10], ['B', 290], ['C', 70]])

describe('mapLucratividade', () => {
  const vm = mapLucratividade({ pedidos, skus: [], custos, cfg, podeVerValores: true, dias: 30, agora: AGORA })
  it('ordena por lucro e classifica pela MC', () => {
    expect(vm.rows.map((r) => r.sku)).toEqual(['A', 'B', 'C', 'D'])
    expect(vm.rows[0].curvaLucro).toBe('A')
  })
  it('prejuízo destacado e fora da curva de lucro', () => {
    const c = vm.rows.find((r) => r.sku === 'C')
    expect(c.faixa).toBe('negativo')
    expect(c.curvaLucro).toBeNull()
    expect(vm.kpis.negativos).toBe(1)
  })
  it('pendente não some e diz o motivo', () => {
    const d = vm.rows.find((r) => r.sku === 'D')
    expect(d.faixa).toBe('pendente')
    expect(vm.pendencias).toEqual([{ motivo: 'custo do produto', skus: 1 }])
    expect(vm.kpis.receitaPendente).toBe(80)
  })
  it('matriz cruza receita × lucro', () => {
    // B é A em receita, mas pouco lucro
    const b = vm.rows.find((r) => r.sku === 'B')
    expect(b.curvaReceita).toBe('A')
    expect(vm.matriz.celulas[b.curvaReceita][b.curvaLucro].skus).toBe(1)
  })
  it('sem acesso: todos pendentes, lucro nulo', () => {
    const v = mapLucratividade({ pedidos, skus: [], custos, cfg, podeVerValores: false, dias: 30, agora: AGORA })
    expect(v.kpis.lucroTotal).toBeNull()
    expect(v.kpis.pendentes).toBe(4)
  })
  it('filtro por faixa', () => {
    expect(filtrarLucratividade(vm.rows, { faixa: 'pendente' }).map((r) => r.sku)).toEqual(['D'])
    expect(filtrarLucratividade(vm.rows, { faixa: 'negativo' }).map((r) => r.sku)).toEqual(['C'])
  })
  it('faixaDe trata zero à parte', () => {
    expect(faixaDe({ mc: 0 })).toBe('zero')
  })
})
