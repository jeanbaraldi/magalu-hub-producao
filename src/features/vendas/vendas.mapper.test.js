import { describe, it, expect } from 'vitest'
import { payloadSpec } from '../magalu/specFixture'
import { mapVendasHoje, variacao, horaBrt, somarUnidades, erroDoSync } from './vendas.mapper'

// 21/10/2026 12:00 BRT
const agora = new Date('2026-10-21T15:00:00Z')
const p = (id, status, total, at, items) => ({ order_id: id, status, total_amount: total, purchased_at: at, payload: payloadSpec(items) })
const item = (sku, quantity, total) => ({ sku, name: `Prod ${sku}`, quantity, total })

describe('vendas.mapper', () => {
  it('hora em Brasília', () => {
    expect(horaBrt('2026-10-21T15:30:00Z')).toBe(12)
    expect(horaBrt('2026-10-21T02:59:00Z')).toBe(23)
  })

  it('variação é null com base zero ou desconhecida', () => {
    expect(variacao(10, 0)).toBeNull()
    expect(variacao(null, 5)).toBeNull()
    expect(variacao(15, 10)).toBe(50)
  })

  it('compara hoje com ontem até a mesma hora', () => {
    const pedidos = [
      p('1', 'approved', 100, '2026-10-21T13:00:00Z', [item('A', 2, 100)]), // hoje 10h
      p('2', 'canceled', 999, '2026-10-21T13:30:00Z', [item('A', 1, 999)]),
      p('3', 'approved', 50, '2026-10-20T13:00:00Z', [item('B', 1, 50)]), // ontem 10h: conta
      p('4', 'approved', 500, '2026-10-20T20:00:00Z', [item('B', 1, 500)]), // ontem 17h: fora
    ]
    const vm = mapVendasHoje(pedidos, agora)
    expect(vm.kpis.receita).toBe(100)
    expect(vm.kpis.pedidos).toBe(1)
    expect(vm.kpis.unidades).toBe(2)
    expect(vm.kpis.cancelados).toBe(1)
    expect(vm.kpis.ontem.receita).toBe(50)
    expect(vm.kpis.variacao.receita).toBe(100)
    expect(vm.ranking.map((r) => r.sku)).toEqual(['A'])
    expect(vm.recentes.map((r) => r.id)).toEqual(['2', '1'])
  })

  it('horas futuras ficam nulas e horas passadas sem venda são zero', () => {
    const vm = mapVendasHoje([], agora)
    expect(vm.horas).toHaveLength(24)
    expect(vm.horas[11].receita).toBe(0)
    expect(vm.horas[13].receita).toBeNull()
    expect(vm.horas[13].futuro).toBe(true)
    expect(vm.kpis.variacao.receita).toBeNull()
  })

  it('total ilegível e quantidade ausente não viram zero', () => {
    const vm = mapVendasHoje([p('1', 'approved', null, '2026-10-21T13:00:00Z', [item('A', null, null)])], agora)
    expect(vm.kpis.receita).toBeNull()
    expect(vm.kpis.semValor).toBe(1)
    expect(vm.kpis.unidades).toBeNull()
    expect(vm.kpis.semQtd).toBe(1)
  })

  it('pedido sem itens legíveis conta como unidade desconhecida', () => {
    expect(somarUnidades([{ payload: {} }])).toEqual({ total: null, semQtd: 1 })
  })
  it('última venda ignora cancelado e marca o estado da barra por hora', () => {
    const vm = mapVendasHoje([
      p('1', 'approved', 100, '2026-10-21T13:00:00Z', [item('A', 1, 100)]),
      p('2', 'cancelled', 50, '2026-10-21T14:00:00Z', [item('A', 1, 50)]),
    ], agora)
    expect(vm.kpis.ultimaVenda).toBe('2026-10-21T13:00:00Z')
    expect(vm.horas[10].estado).toBe('passado')
    expect(vm.horas[12].estado).toBe('agora')
    expect(vm.horas[13].estado).toBe('futuro')
  })

  it('sem venda hoje não há última venda', () => {
    expect(mapVendasHoje([], agora).kpis.ultimaVenda).toBeNull()
  })
  it('erro do sync vem de dentro do 200, por loja', () => {
    expect(erroDoSync({ accounts: [{ account_id: 'x', orders: { fetched: 3 } }] }, 'x')).toBeNull()
    expect(erroDoSync({ accounts: [{ account_id: 'x', error: 'token' }] }, 'x')).toBe('token')
    expect(erroDoSync({ accounts: [{ account_id: 'x', orders: { error: 'HTTP 429' } }] }, 'x')).toBe('HTTP 429')
    expect(erroDoSync({ accounts: [{ account_id: 'x', skipped: 'sem_tempo' }] }, 'x')).toMatch('sem_tempo')
    expect(erroDoSync(null, 'x')).toBeNull()
  })
})
