import { describe, it, expect } from 'vitest'
import { pedidoContaComoVenda, diaBrt, inicioDoPeriodo, somarReceita } from './vendas'

describe('vendas', () => {
  it('cancelado e sem status não contam como venda', () => {
    expect(pedidoContaComoVenda('approved')).toBe(true)
    expect(pedidoContaComoVenda('CANCELED')).toBe(false)
    expect(pedidoContaComoVenda(null)).toBe(false)
  })
  it('dia é de Brasília', () => {
    expect(diaBrt('2026-10-21T02:30:00Z')).toBe('2026-10-20')
    expect(diaBrt('2026-10-21T03:00:00Z')).toBe('2026-10-21')
    expect(diaBrt('lixo')).toBeNull()
  })
  it('início do período inclui hoje', () => {
    expect(inicioDoPeriodo(1, new Date('2026-10-21T15:00:00Z'))).toBe('2026-10-21T03:00:00.000Z')
    expect(inicioDoPeriodo(7, new Date('2026-10-21T15:00:00Z'))).toBe('2026-10-15T03:00:00.000Z')
  })
  it('receita sem valor nunca vira zero', () => {
    expect(somarReceita([])).toEqual({ total: null, conhecidos: 0, semValor: 0 })
    expect(somarReceita([{ total_amount: null }])).toEqual({ total: null, conhecidos: 0, semValor: 1 })
    expect(somarReceita([{ total_amount: 10 }, { total_amount: null }])).toEqual({ total: 10, conhecidos: 1, semValor: 1 })
  })
})
