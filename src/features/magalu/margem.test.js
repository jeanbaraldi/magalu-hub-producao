import { describe, it, expect } from 'vitest'
import { calcularMargem, curvaAbc } from './margem'

const cfg = { tax_pct: 10, commission_pct: 16, freight_pct: null }

describe('calcularMargem', () => {
  it('calcula com custo, imposto e comissão; frete opcional', () => {
    const r = calcularMargem({ receita: 100, unidades: 2 }, 20, cfg)
    expect(r.mc).toBeCloseTo(100 - 40 - 16 - 10)
    expect(r.mcPct).toBeCloseTo(34)
    expect(r.semFrete).toBe(true)
  })
  it('sem custo a margem é indisponível e diz o motivo', () => {
    const r = calcularMargem({ receita: 100, unidades: 1 }, null, cfg)
    expect(r.mc).toBeNull()
    expect(r.faltando).toContain('custo do produto')
  })
  it('sem comissão ou imposto também é indisponível', () => {
    const r = calcularMargem({ receita: 100, unidades: 1 }, 10, null)
    expect(r.mc).toBeNull()
    expect(r.faltando).toEqual(['alíquota de imposto', 'comissão da Magalu'])
  })
  it('item sem valor deixa a margem indisponível', () => {
    expect(calcularMargem({ receita: 100, unidades: 1, itensSemValor: 1 }, 10, cfg).mc).toBeNull()
  })
  it('custo zero cadastrado é zero de verdade', () => {
    expect(calcularMargem({ receita: 100, unidades: 1 }, 0, cfg).mc).toBeCloseTo(74)
  })
})

describe('curvaAbc', () => {
  it('quem cruza 80% ainda é A; valor nulo fica fora', () => {
    const linhas = [{ id: 'a', v: 70 }, { id: 'b', v: 20 }, { id: 'c', v: 6 }, { id: 'd', v: 4 }, { id: 'e', v: null }]
    const r = curvaAbc(linhas, (l) => l.v)
    expect(r.map((l) => l.curva)).toEqual(['A', 'A', 'B', 'C', null])
    expect(r[4].participacao).toBeNull()
  })
})
