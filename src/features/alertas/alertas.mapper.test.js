import { describe, it, expect } from 'vitest'
import { diagnosticar, dividirSemanas } from './alertas.mapper'

const agora = new Date('2026-10-21T15:00:00Z')
const limites = { desde7: '2026-10-15T03:00:00.000Z', desde14: '2026-10-08T03:00:00.000Z' }
const syncOk = { finished_at: '2026-10-21T12:00:00Z', truncated: false, error: null }
const ped = (id, quando, sku, qtd, total) => ({ order_id: id, status: 'approved', purchased_at: quando, payload: { items: [{ sku, quantity: qtd, total }] } })
const base = { limites, custos: new Map(), cfg: { tax_pct: 8, commission_pct: 16 }, podeVerValores: true, syncs: { orders: syncOk, skus: syncOk }, agora }

describe('alertas.mapper', () => {
  it('ruptura só com estoque 0; nulo vira "não informado"', () => {
    const r = diagnosticar({
      ...base,
      custos: new Map([['A', 1], ['B', 1]]),
      skus: [{ sku: 'A', title: 'Panela', stock: 0 }, { sku: 'B', title: 'Tampa', stock: null }],
      pedidos: [ped('1', '2026-10-20T12:00:00Z', 'A', 1, 10), ped('2', '2026-10-20T12:00:00Z', 'B', 1, 10)],
    })
    expect(r.itens.map((i) => i.tipo)).toEqual(['ruptura', 'estoque_nao_informado'])
    expect(r.grupos[0].itens).toHaveLength(1)
  })
  it('estoque baixo pela cobertura de 7 dias', () => {
    const pedidos = Array.from({ length: 30 }, (_, i) => ped(String(i), '2026-10-01T12:00:00Z', 'A', 1, 10))
    const r = diagnosticar({ ...base, custos: new Map([['A', 1]]), skus: [{ sku: 'A', stock: 5 }], pedidos })
    expect(r.itens.find((i) => i.tipo === 'estoque_baixo')).toBeTruthy()
    const ok = diagnosticar({ ...base, custos: new Map([['A', 1]]), skus: [{ sku: 'A', stock: 50 }], pedidos })
    expect(ok.itens.find((i) => i.tipo === 'estoque_baixo')).toBeUndefined()
  })
  it('queda de vendas exige base mínima', () => {
    const antes = [1, 2, 3].map((i) => ped(`a${i}`, '2026-10-10T12:00:00Z', 'A', 1, 100))
    const depois = [ped('d1', '2026-10-20T12:00:00Z', 'A', 1, 100)]
    const r = diagnosticar({ ...base, custos: new Map([['A', 1]]), skus: [{ sku: 'A', stock: 999 }], pedidos: [...antes, ...depois] })
    expect(r.itens.filter((i) => i.tipo === 'queda_vendas')).toHaveLength(1)
    const pouca = diagnosticar({ ...base, custos: new Map([['A', 1]]), skus: [{ sku: 'A', stock: 999 }], pedidos: antes.slice(0, 2) })
    expect(pouca.itens.filter((i) => i.tipo === 'queda_vendas')).toHaveLength(0)
  })
  it('custo e configuração só para quem pode ver valores', () => {
    const args = { ...base, cfg: null, skus: [{ sku: 'A', stock: 999 }], pedidos: [ped('1', '2026-10-20T12:00:00Z', 'A', 1, 10)] }
    expect(diagnosticar(args).itens.map((i) => i.tipo)).toEqual(expect.arrayContaining(['sem_custo', 'config']))
    expect(diagnosticar({ ...args, podeVerValores: false }).itens.map((i) => i.tipo)).not.toContain('sem_custo')
  })
  it('sincronização com erro, parcial, velha ou ausente', () => {
    const r = diagnosticar({ ...base, skus: [], pedidos: [], syncs: { orders: { finished_at: '2026-10-19T00:00:00Z', error: 'token expirado' }, skus: null } })
    expect(r.itens.map((i) => i.id)).toEqual(['sync:orders:erro', 'sync:orders:velha', 'sync:skus'])
  })
  it('divide as semanas por purchased_at', () => {
    const { atual, anterior } = dividirSemanas([{ purchased_at: '2026-10-16T00:00:00Z' }, { purchased_at: '2026-10-09T00:00:00Z' }, { purchased_at: '2026-10-01T00:00:00Z' }, {}], limites.desde7, limites.desde14)
    expect([atual.length, anterior.length]).toEqual([1, 1])
  })
})
