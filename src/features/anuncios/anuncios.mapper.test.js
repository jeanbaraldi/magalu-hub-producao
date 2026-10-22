import { describe, it, expect } from 'vitest'
import {
  mapSkuRow, enriquecerSkus, filtrarSkus, ordenarSkus, contarAbas, agruparFamilias,
  mapSkusResumo, margemUnitaria, taxaComissaoObservada,
} from './anuncios.mapper'

const s = (sku, status, stock, price = 10, list = null, payload = {}) =>
  mapSkuRow({ sku, title: `Produto ${sku}`, status, stock, price, list_price: list, payload })
const cfg = { tax_pct: 10, commission_pct: 16, freight_pct: 5 }

describe('anuncios.mapper', () => {
  it('lê fotos, marca, família, Full e link do payload; ausente fica desconhecido', () => {
    const r = s('a', 'PUBLISHED', 1, 10, null, {
      images: [{}, {}], videos: [], brand: 'Rekar', group: { id: 'g1', main_variation: true }, fulfillment: false,
      url_marketplace: [{ channel: 'magazineluiza', url: 'https://magalu/p/1' }],
    })
    expect(r).toMatchObject({ ativo: true, fotos: 2, videos: 0, marca: 'Rekar', grupoId: 'g1', variacaoPrincipal: true, full: false, url: 'https://magalu/p/1' })
    expect(s('b', 'UNPUBLISHED', 1)).toMatchObject({ ativo: false, naoPublicado: true, fotos: null, full: null, url: null })
  })

  it('aceita os campos do payload trazidos por alias no select', () => {
    const r = mapSkuRow({ sku: 'x', status: 'PUBLISHED', price: 1, images: [{}, {}, {}], brand: 'B', group: { id: 'g' }, fulfillment: true })
    expect(r).toMatchObject({ fotos: 3, marca: 'B', grupoId: 'g', full: true })
  })

  it('desconto só com os dois preços', () => {
    expect(s('a', 'PUBLISHED', 1, 80, 100).descontoPct).toBeCloseTo(20)
    expect(s('a', 'PUBLISHED', 1, 80, null).descontoPct).toBeNull()
  })

  it('margem por unidade usa a comissão real das vendas quando completa', () => {
    const venda = { receita: 200, comissao: 20, itensSemComissao: 0, itensSemValor: 0 }
    expect(taxaComissaoObservada(venda)).toBeCloseTo(0.1)
    const m = margemUnitaria(s('a', 'PUBLISHED', 1, 100), { custo: 40, cfg, venda, podeVerValores: true })
    // 100 − 40 custo − 10 comissão (10% real) − 10 imposto − 5 frete
    expect(m.mc).toBeCloseTo(35)
    expect(m.mcPct).toBeCloseTo(35)
    expect(m.linhas.comissao.fonte).toBe('magalu')
  })

  it('sem comissão real cai no % configurado; sem custo a margem é indisponível', () => {
    const r = s('a', 'PUBLISHED', 1, 100)
    const comPct = margemUnitaria(r, { custo: 40, cfg, venda: { receita: 100, comissao: 5, itensSemComissao: 1, itensSemValor: 0 }, podeVerValores: true })
    expect(comPct.linhas.comissao.fonte).toBe('percentual')
    expect(comPct.mc).toBeCloseTo(29)
    const semCusto = margemUnitaria(r, { custo: null, cfg, venda: null, podeVerValores: true })
    expect(semCusto.mc).toBeNull()
    expect(semCusto.faltando).toContain('custo do produto')
  })

  it('sem acesso a valores a margem fica bloqueada, nunca zero', () => {
    const [a] = enriquecerSkus([s('a', 'PUBLISHED', 1, 100)], { custos: new Map([['a', 40]]), cfg, podeVerValores: false })
    expect(a.margem).toEqual({ bloqueado: true })
    expect(a.custo).toBeNull()
  })

  it('preço desconhecido não calcula margem', () => {
    expect(margemUnitaria(s('a', 'PUBLISHED', 1, null), { custo: 1, cfg, podeVerValores: true }).faltando).toEqual(['preço do anúncio'])
  })

  it('abas, sub-filtros e busca; estoque desconhecido não é zero', () => {
    const rows = enriquecerSkus([
      s('a', 'PUBLISHED', 0, 10, 20, { brand: 'Rekar' }),
      s('b', 'PUBLISHED', null),
      s('c', 'UNPUBLISHED', 3),
    ], { custos: new Map([['a', 5]]), vendas: new Map([['b', { unidades: 4, receita: 40, comissao: 4, itensSemComissao: 0, itensSemValor: 0, itensSemQtd: 0 }]]), cfg, podeVerValores: true })
    expect(contarAbas(rows)).toEqual({ todos: 3, ativos: 2, com_custo: 1, sem_custo: 2, nao_publicados: 1 })
    expect(filtrarSkus(rows, { aba: 'ativos', sub: 'sem_estoque' }).map((r) => r.sku)).toEqual(['a'])
    expect(filtrarSkus(rows, { aba: 'ativos', sub: 'com_desconto' }).map((r) => r.sku)).toEqual(['a'])
    expect(filtrarSkus(rows, { aba: 'ativos', sub: 'vendeu' }).map((r) => r.sku)).toEqual(['b'])
    expect(filtrarSkus(rows, { busca: 'rekar' }).map((r) => r.sku)).toEqual(['a'])
    expect(rows.find((r) => r.sku === 'c').vendidos30).toBe(0)
  })

  it('ordenação deixa valor desconhecido no fim', () => {
    const rows = enriquecerSkus([s('a', 'PUBLISHED', null, 5), s('b', 'PUBLISHED', 2, null), s('c', 'PUBLISHED', 1, 9)])
    expect(ordenarSkus(rows, 'maior_preco').map((r) => r.sku)).toEqual(['c', 'a', 'b'])
    expect(ordenarSkus(rows, 'menor_estoque').map((r) => r.sku)).toEqual(['c', 'b', 'a'])
  })

  it('famílias por group.id; pai é a variação principal; estoque desconhecido não soma', () => {
    const rows = enriquecerSkus([
      s('a', 'PUBLISHED', 2, 10, null, { group: { id: 'g' } }),
      s('b', 'PUBLISHED', null, 20, null, { group: { id: 'g', main_variation: true } }),
      s('c', 'PUBLISHED', 1, 5, null, { group: { id: 'solo' } }),
    ])
    const { familias, soltos } = agruparFamilias(rows)
    expect(familias).toHaveLength(1)
    expect(familias[0]).toMatchObject({ precoMin: 10, precoMax: 20, estoqueTotal: null, estoqueDesconhecido: 1 })
    expect(familias[0].pai.sku).toBe('b')
    expect(soltos.map((r) => r.sku)).toEqual(['c'])
  })

  it('resumo: preço médio e estoque só do que é conhecido', () => {
    const resumo = mapSkusResumo(enriquecerSkus([s('a', 'PUBLISHED', 2, 10), s('b', 'PUBLISHED', null, null)]))
    expect(resumo).toMatchObject({ total: 2, estoqueTotal: 2, estoqueDesconhecido: 1, precoMedio: 10, semCusto: 2 })
    expect(mapSkusResumo([]).precoMedio).toBeNull()
  })
})

describe('contarSubfiltros', () => {
  it('conta só os ativos, por sub-filtro', async () => {
    const { contarSubfiltros } = await import('./anuncios.mapper')
    const rows = enriquecerSkus([s('a', 'PUBLISHED', 0), s('b', 'PUBLISHED', 3, 80, 100), s('c', 'UNPUBLISHED', 0)])
    expect(contarSubfiltros(rows)).toMatchObject({ todos: 2, sem_estoque: 1, estoque_baixo: 1, com_desconto: 1 })
  })
})
