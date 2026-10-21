import { describe, it, expect } from 'vitest'
import { mapRelatorio, listaDias, diaDaSemana } from './relatorios.mapper'

const agora = new Date('2026-10-21T15:00:00Z') // quarta, 12h BRT
const p = (id, status, total, at, items = []) => ({ order_id: id, status, total_amount: total, purchased_at: at, payload: { items } })

describe('relatorios.mapper', () => {
  it('período atual inclui hoje; o anterior são os N dias antes', () => {
    expect(listaDias(3, agora)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21'])
    expect(listaDias(3, agora, 3)).toEqual(['2026-10-16', '2026-10-17', '2026-10-18'])
  })

  it('dia da semana de uma data BRT', () => {
    expect(diaDaSemana('2026-10-21')).toBe(3)
  })

  it('compara receita, pedidos e cancelados entre períodos', () => {
    const pedidos = [
      p('1', 'approved', 200, '2026-10-21T13:00:00Z', [{ sku: 'A', quantity: 2, total: 200 }]),
      p('2', 'canceled', 50, '2026-10-20T13:00:00Z'),
      p('3', 'approved', 100, '2026-10-17T13:00:00Z', [{ sku: 'A', quantity: 1, total: 100 }]),
      p('4', 'approved', 999, '2026-10-10T13:00:00Z'), // fora dos dois períodos
    ]
    const vm = mapRelatorio({ pedidos, dias: 3, agora })
    expect(vm.kpis.atual.receita).toBe(200)
    expect(vm.kpis.anterior.receita).toBe(100)
    expect(vm.kpis.variacao.receita).toBe(100)
    expect(vm.kpis.atual.cancelados).toBe(1)
    expect(vm.kpis.variacao.cancelados).toBeNull() // anterior 0: sem base
    expect(vm.serie.map((s) => s.atual)).toEqual([0, 0, 200])
    expect(vm.serie.map((s) => s.anterior)).toEqual([0, 100, 0])
    expect(vm.topSkus[0]).toMatchObject({ sku: 'A', receita: 200, receitaAnterior: 100, variacao: 100 })
  })

  it('dia com vendas de valor ilegível fica nulo, não zero', () => {
    const vm = mapRelatorio({ pedidos: [p('1', 'approved', null, '2026-10-21T13:00:00Z')], dias: 3, agora })
    expect(vm.serie[2].atual).toBeNull()
    expect(vm.kpis.atual.receita).toBeNull()
    expect(vm.kpis.atual.semValor).toBe(1)
    const qua = vm.porDiaSemana.find((d) => d.dow === 3)
    expect(qua.receita).toBeNull()
  })

  it('sem nenhum pedido os totais são zero real e a variação é nula', () => {
    const vm = mapRelatorio({ pedidos: [], dias: 7, agora })
    expect(vm.kpis.atual.receita).toBe(0)
    expect(vm.kpis.variacao.receita).toBeNull()
    expect(vm.porDiaSemana.every((d) => d.ocorrencias === 1)).toBe(true)
  })
})
