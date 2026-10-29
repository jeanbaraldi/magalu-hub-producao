import { describe, it, expect } from 'vitest'
import { calcularMargem, curvaAbc, custosReaisPorSku, custoRealDoSku, pesoCobradoG } from './margem'

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

describe('calcularMargem com a comissão informada pela Magalu', () => {
  const cfg = { tax_pct: 10, commission_pct: null, freight_pct: null }
  it('usa a comissão real quando todo item trouxe e dispensa o %', () => {
    const m = calcularMargem({ receita: 100, unidades: 1, comissao: 16, itensSemComissao: 0 }, 50, cfg)
    expect(m.mc).toBe(24)
    expect(m.fonteComissao).toBe('magalu')
  })
  it('item sem comissão e sem % configurado: margem indisponível', () => {
    const m = calcularMargem({ receita: 100, unidades: 1, comissao: 16, itensSemComissao: 1 }, 50, cfg)
    expect(m.mc).toBeNull()
    expect(m.faltando).toContain('comissão da Magalu')
  })
  it('item sem comissão com % configurado: usa o % para o SKU inteiro', () => {
    const m = calcularMargem({ receita: 100, unidades: 1, comissao: 16, itensSemComissao: 1 }, 50, { ...cfg, commission_pct: 20 })
    expect(m.mc).toBe(20)
    expect(m.fonteComissao).toBe('percentual')
  })
})

describe('custo real medido na Magalu (frete e intermediação)', () => {
  const venda = { receita: 200, unidades: 2, comissao: 30, itensSemComissao: 0 }

  it('frete medido por unidade vence o frete% configurado e entra a intermediação', () => {
    const m = calcularMargem(venda, 40, { ...cfg, freight_pct: 50 }, { fretePorUnidade: 12.5, mdrPct: 0.04 })
    expect(m.componentes.frete).toBe(25)
    expect(m.componentes.mdr).toBe(8)
    expect(m.fonteFrete).toBe('magalu')
    expect(m.semMdr).toBe(false)
    // 200 − 80 − 30 − 20 − 25 − 8
    expect(m.mc).toBe(37)
  })

  it('sem medição cai no frete% e a intermediação fica fora, marcada', () => {
    const m = calcularMargem(venda, 40, { ...cfg, freight_pct: 5 }, null)
    expect(m.componentes.frete).toBe(10)
    expect(m.componentes.mdr).toBeNull()
    expect(m.semMdr).toBe(true)
    expect(m.fonteFrete).toBe('percentual')
  })

  it('custosReaisPorSku: frete por unidade, MDR do SKU e média da loja para SKU sem medição', () => {
    const reais = custosReaisPorSku([
      { sku: 'A', unidades_vendidas: 2, venda: 100, frete: 20, mdr: 4 },
      { sku: 'B', unidades_vendidas: 1, venda: 300, frete: null, mdr: 12 },
      { sku: 'C', unidades_vendidas: 0, venda: 0, frete: 5, mdr: 0 },
    ])
    expect(custoRealDoSku(reais, 'A')).toMatchObject({ fretePorUnidade: 10, mdrPct: 0.04, unidadesMedidas: 2, freteEstimado: false })
    // Venda medida sem débito de frete: a Magalu não cobrou frete do vendedor.
    expect(custoRealDoSku(reais, 'B').fretePorUnidade).toBe(0)
    // Sem medição: frete desconhecido (não é estimado pela loja), MDR = média ponderada.
    expect(custoRealDoSku(reais, 'Z')).toMatchObject({ fretePorUnidade: null, mdrPct: 16 / 400, unidadesMedidas: 0, freteEstimado: false })
  })
})

describe('estimativa para SKU que nunca vendeu', () => {
  const dims = (g, c, l, a) => [{ name: 'package', weight: { unit: 'g', value: g }, length: { unit: 'cm', value: c }, width: { unit: 'cm', value: l }, height: { unit: 'cm', value: a } }]

  it('pesoCobradoG: maior entre o peso real e o cubado (÷ 6000)', () => {
    expect(pesoCobradoG(dims(450, 22, 10, 11))).toBe(450)
    expect(pesoCobradoG(dims(400, 30, 20, 30))).toBe(3000)
    expect(pesoCobradoG(null)).toBeNull()
    expect(pesoCobradoG([{ name: 'package', weight: { unit: 'lb', value: 1 } }])).toBeNull()
  })

  it('frete pela média da faixa de peso; comissão e MDR pela média da loja', () => {
    const pesos = new Map([['A', 800], ['B', 900], ['C', 4000], ['Z', 700], ['W', 4500]])
    const reais = custosReaisPorSku([
      { sku: 'A', unidades_vendidas: 1, venda: 100, frete: 10, mdr: 4, comissao: 20 },
      { sku: 'B', unidades_vendidas: 3, venda: 300, frete: 60, mdr: 12, comissao: 30 },
      { sku: 'C', unidades_vendidas: 1, venda: 100, frete: 30, mdr: 4, comissao: 10 },
    ], pesos)
    const z = custoRealDoSku(reais, 'Z')
    expect(z.fretePorUnidade).toBe(70 / 4)
    expect(z.freteEstimado).toBe(true)
    expect(z.comissaoPct).toBe(60 / 500)
    expect(z.comissaoDaLoja).toBe(true)
    // Faixa com um SKU só não serve de estimativa: cai no frete médio da loja em % da venda.
    const w = custoRealDoSku(reais, 'W')
    expect(w.fretePorUnidade).toBeNull()
    expect(w.fretePct).toBe(100 / 500)
    expect(calcularMargem({ receita: 50, unidades: 1, comissao: 6, itensSemComissao: 0 }, 10, cfg, w).componentes.frete).toBe(10)
    const m = calcularMargem({ receita: 100, unidades: 1, comissao: 12, itensSemComissao: 0 }, 30, cfg, z)
    expect(m.fonteFrete).toBe('estimado')
  })
})
