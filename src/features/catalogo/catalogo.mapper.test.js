import { describe, it, expect } from 'vitest'
import { contarAbas, filtrarCatalogo, mapCatalogo, margemUnitaria, ordenarCatalogo, resumoAnuncios, totaisCatalogo } from './catalogo.mapper'

const cfg = { tax_pct: 10, commission_pct: 20, freight_pct: null }
const sku = (over = {}) => ({ sku: 'A1', title: 'Calha', status: 'PUBLISHED', price: 100, list_price: null, stock: 5, image_url: null, ...over })
const venda = (over = {}) => ({ sku: 'A1', unidades: 2, receita: 200, comissao: 30, itensSemComissao: 0, itensSemValor: 0, itensSemQtd: 0, ...over })

describe('margemUnitaria', () => {
  it('usa a taxa de comissão real da Magalu no preço atual', () => {
    const u = margemUnitaria(100, 40, venda(), cfg)
    expect(u.parts.comissao).toBe(15) // 30/200 = 15%
    expect(u.parts.fonteComissao).toBe('magalu')
    expect(u.mc).toBe(100 - 15 - 40 - 10)
  })
  it('sem venda cai no % configurado; sem custo a margem fica nula com o motivo', () => {
    expect(margemUnitaria(100, 40, null, cfg).parts.comissao).toBe(20)
    const u = margemUnitaria(100, null, null, cfg)
    expect(u.mc).toBeNull()
    expect(u.faltando).toContain('custo do produto')
  })
})

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
    expect(resumoAnuncios(rows)).toEqual({ total: 2, estoque: 10, precoMedio: 100, vendidos30: 2 })
    expect(totaisCatalogo(rows)).toEqual({ receita: 200, unidades: 2, contribuicao: 70, pendentes: 0 })
  })
  it('contribuição total pendente se um SKU que vendeu não tem custo', () => {
    const r = mapCatalogo([sku(), sku({ sku: 'C3' })], new Map([['A1', 40]]), { linhas: [venda(), venda({ sku: 'C3' })] }, cfg, { podeVerValores: true })
    expect(totaisCatalogo(r)).toMatchObject({ contribuicao: null, pendentes: 1 })
  })
})
