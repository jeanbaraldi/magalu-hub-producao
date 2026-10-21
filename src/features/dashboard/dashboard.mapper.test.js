import { describe, it, expect } from 'vitest'
import { mapDashboard, diasDoPeriodo } from './dashboard.mapper'

const agora = new Date('2026-10-21T15:00:00Z')
const p = (status, total, at) => ({ status, total_amount: total, purchased_at: at })

describe('dashboard.mapper', () => {
  it('dias do período terminam hoje em BRT', () => {
    expect(diasDoPeriodo(3, agora)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21'])
  })
  it('série e KPIs ignoram cancelados e separam hoje', () => {
    const pedidos = [
      p('approved', 100, '2026-10-21T12:00:00Z'),
      p('canceled', 999, '2026-10-21T12:00:00Z'),
      p('delivered', 50, '2026-10-20T02:00:00Z'), // 19/10 23h BRT
      p('approved', null, '2026-10-20T12:00:00Z'),
    ]
    const vm = mapDashboard({ pedidos, skus: [], dias: 3, agora })
    expect(vm.kpis.receita).toBe(150)
    expect(vm.kpis.semValor).toBe(1)
    expect(vm.kpis.cancelados).toBe(1)
    expect(vm.kpis.hojeReceita).toBe(100)
    expect(vm.serie.map((d) => d.receita)).toEqual([50, null, 100])
  })
})
