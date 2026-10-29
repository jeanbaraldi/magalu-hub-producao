import { describe, it, expect } from 'vitest'
import { contarAbas, filtrarCatalogo, mapCatalogo, ordenarCatalogo, totaisCatalogo } from './catalogo.mapper'

const cfg = { tax_pct: 10, commission_pct: 20, freight_pct: null }
const sku = (over = {}) => ({ sku: 'A1', title: 'Calha', status: 'PUBLISHED', price: 100, list_price: null, stock: 5, image_url: null, ...over })
const venda = (over = {}) => ({ sku: 'A1', unidades: 2, receita: 200, comissao: 30, itensSemComissao: 0, itensSemValor: 0, itensSemQtd: 0, ...over })

describe('mapCatalogo', () => {
  const custos = new Map([['A1', 40], ['B2', 0]])
  const rows = mapCatalogo([sku(), sku({ sku: 'B2', status: 'UNPUBLISHED', price: null })], custos, { linhas: [venda()] }, cfg, { podeVerValores: true })
  it('custo zero é sem custo; não publicado conta como pausado', () => {
    const b = rows.find((r) => r.sku === 'B2')
    expect(b.temCusto).toBe(false)
    expect(b.pausado).toBe(true)
    expect(b.statusInfo.label).toBe('Não publicado')
    expect(b.vendas30).toBe(0)
    expect(b.contribuicao30).toBeNull()
  })
  it('contribuição de 30 dias pela regra única e curva ABC', () => {
    const a = rows.find((r) => r.sku === 'A1')
    expect(a.contribuicao30).toBe(200 - 80 - 30 - 20)
    expect(a.curva).toBe('A')
  })
  it('vendas indisponíveis ficam null, não zero; sem acesso a valores não há custo', () => {
    expect(mapCatalogo([sku()], custos, null, cfg, { podeVerValores: true })[0].vendas30).toBeNull()
    expect(mapCatalogo([sku()], custos, null, cfg, { podeVerValores: false })[0].custo).toBeNull()
  })
  it('abas, busca, ordem, resumo e totais', () => {
    expect(contarAbas(rows)).toEqual({ todos: 2, ativos: 1, com_custo: 1, sem_custo: 1, pausados: 1 })
    expect(filtrarCatalogo(rows, { busca: 'cálha' })).toHaveLength(2)
    expect(filtrarCatalogo(rows, { aba: 'sem_custo' }).map((r) => r.sku)).toEqual(['B2'])
    expect(ordenarCatalogo(rows, 'receita')[0].sku).toBe('A1')
    expect(totaisCatalogo(rows)).toEqual({ receita: 200, unidades: 2, contribuicao: 70, pendentes: 0 })
  })
  it('frete e intermediação medidos na Magalu entram na contribuição (mesma regra de Anúncios)', () => {
    const reais = { porSku: new Map([['A1', { unidades: 10, fretePorUnidade: 5, mdrPct: 0.04, comissaoPct: 0.15 }]]), mdrPctLoja: 0.04, comissaoPctLoja: 0.15, fretePctLoja: null, fretePorFaixa: [], pesos: new Map() }
    const [a] = mapCatalogo([sku()], custos, { linhas: [venda()] }, cfg, { podeVerValores: true, reais })
    expect(a.contribuicao30).toBeCloseTo(200 - 80 - 30 - 20 - 10 - 8)
  })
  it('contribuição total pendente se um SKU que vendeu não tem custo', () => {
    const r = mapCatalogo([sku(), sku({ sku: 'C3' })], new Map([['A1', 40]]), { linhas: [venda(), venda({ sku: 'C3' })] }, cfg, { podeVerValores: true })
    expect(totaisCatalogo(r)).toMatchObject({ contribuicao: null, pendentes: 1 })
  })
})
