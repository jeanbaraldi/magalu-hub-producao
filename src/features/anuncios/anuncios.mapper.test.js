import { describe, it, expect } from 'vitest'
import { mapSkuRow, filtrarSkus, mapSkusResumo } from './anuncios.mapper'

const s = (sku, status, stock, price = 10, list = null) => mapSkuRow({ sku, title: `Produto ${sku}`, status, stock, price, list_price: list })

describe('anuncios.mapper', () => {
  it('desconto só com os dois preços', () => {
    expect(s('a', 'active', 1, 80, 100).descontoPct).toBeCloseTo(20)
    expect(s('a', 'active', 1, 80, null).descontoPct).toBeNull()
  })
  it('estoque desconhecido não conta como zerado', () => {
    const rows = [s('a', 'active', 0), s('b', 'active', null), s('c', 'inactive', 3)]
    expect(filtrarSkus(rows, { filtro: 'sem_estoque' }).map((r) => r.sku)).toEqual(['a'])
    expect(filtrarSkus(rows, { filtro: 'estoque_baixo' }).map((r) => r.sku)).toEqual(['c'])
    const resumo = mapSkusResumo(rows)
    expect(resumo).toMatchObject({ total: 3, ativos: 2, semEstoque: 1, estoqueDesconhecido: 1, estoqueTotal: 3 })
  })
  it('sem estoque conhecido o total é nulo', () => {
    expect(mapSkusResumo([s('a', 'active', null)]).estoqueTotal).toBeNull()
  })
})
