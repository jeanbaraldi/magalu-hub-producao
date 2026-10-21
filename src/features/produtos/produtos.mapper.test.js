import { describe, it, expect } from 'vitest'
import { mapProdutos, filtrarProdutos, resumoCustos, parseImportacao, parseCusto } from './produtos.mapper'

const skus = [
  { sku: 'A', title: 'Panela', price: 100 },
  { sku: 'B', title: 'Frigideira', price: null },
  { sku: 'C', title: 'Tampa', price: 50 },
]
const custos = new Map([['A', 40], ['B', 10]])
const vendas = { linhas: [{ sku: 'A', unidades: 3, itensSemQtd: 0 }, { sku: 'C', unidades: 1, itensSemQtd: 1 }] }

describe('produtos.mapper', () => {
  it('markup e margem só com preço e custo conhecidos', () => {
    const [a, b, c] = mapProdutos(skus, custos, vendas, { podeVerValores: true })
    expect(a).toMatchObject({ custo: 40, markup: 2.5, margemUnit: 60, margemPct: 60, vendas30: 3 })
    expect(b).toMatchObject({ custo: 10, markup: null, margemUnit: null, vendas30: 0 })
    expect(c).toMatchObject({ custo: null, temCusto: false, margemUnit: null, vendasParcial: true })
  })
  it('sem acesso a valores não expõe custo', () => {
    const [a] = mapProdutos(skus, custos, vendas, { podeVerValores: false })
    expect(a.custo).toBeNull()
    expect(a.temCusto).toBe(false)
  })
  it('vendas indisponíveis ficam nulas, não zero', () => {
    expect(mapProdutos(skus, custos, null, { podeVerValores: true })[1].vendas30).toBeNull()
  })
  it('filtra por custo e conta cobertura', () => {
    const rows = mapProdutos(skus, custos, vendas, { podeVerValores: true })
    expect(filtrarProdutos(rows, { filtro: 'sem_custo' }).map((r) => r.sku)).toEqual(['C'])
    expect(filtrarProdutos(rows, { busca: 'frig' }).map((r) => r.sku)).toEqual(['B'])
    expect(resumoCustos(rows)).toEqual({ total: 3, comCusto: 2 })
  })
  it('parseCusto aceita formatos brasileiros', () => {
    expect(parseCusto('1.234,56')).toBeCloseTo(1234.56)
    expect(parseCusto('R$ 12,5')).toBe(12.5)
    expect(parseCusto('')).toBeNull()
    expect(Number.isNaN(parseCusto('-3'))).toBe(true)
    expect(Number.isNaN(parseCusto('abc'))).toBe(true)
  })
  it('importação separa válidas, fora do catálogo e inválidas', () => {
    const r = parseImportacao('A;10,5\nZ;3\nB\nC;xx\n\nA;11', new Set(['A', 'B', 'C']))
    expect(r.validas).toEqual([{ sku: 'A', custo: 11, linha: 6 }])
    expect(r.foraDoCatalogo.map((x) => x.sku)).toEqual(['Z'])
    expect(r.invalidas.map((x) => x.linha)).toEqual([1, 3, 4])
  })
})
