import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import AnuncioCard from './AnuncioCard'
import FamiliaCard from './FamiliaCard'
import { agruparFamilias, enriquecerSkus, mapSkuRow } from '../../features/anuncios/anuncios.mapper'

const cfg = { tax_pct: 10, commission_pct: 16, freight_pct: 5 }
const row = (over = {}) => mapSkuRow({ sku: 'SKU1', title: 'Alto falante', status: 'PUBLISHED', price: 100, list_price: 120, stock: 3, image_url: null, payload: { images: [{}], brand: 'Eros' }, ...over })
const html = (el) => renderToString(<MemoryRouter>{el}</MemoryRouter>)

describe('AnuncioCard', () => {
  it('mostra preço com desconto, margem e quebra de custos', () => {
    const [a] = enriquecerSkus([row()], { custos: new Map([['SKU1', 40]]), cfg, podeVerValores: true })
    const h = html(<AnuncioCard anuncio={a} />)
    expect(h).toContain('Margem de contribuição')
    expect(h).toContain('Comissão (16,0% configurada)')
    expect(h).toContain('-17%')
    expect(h).toContain('Custo R$')
  })

  it('campos desconhecidos viram "—" e sem acesso não mostra margem', () => {
    const [a] = enriquecerSkus([row({ price: null, list_price: null, stock: null, payload: {} })], { cfg, podeVerValores: false })
    const h = html(<AnuncioCard anuncio={a} />)
    expect(h).toContain('estoque não informado')
    expect(h).toContain('Seu acesso não inclui custos e margem')
    expect(h).not.toContain('R$ 0,00')
  })

  it('sem custo cadastrado pede o cadastro', () => {
    const [a] = enriquecerSkus([row()], { cfg, podeVerValores: true })
    const h = html(<AnuncioCard anuncio={a} />)
    expect(h).toContain('cadastre o custo para calcular')
    expect(h).toContain('Cadastrar custo')
  })

  it('família renderiza a faixa de preço', () => {
    const rows = enriquecerSkus([row({ sku: 'A', payload: { group: { id: 'g' } } }), row({ sku: 'B', price: 150, payload: { group: { id: 'g' } } })])
    const { familias } = agruparFamilias(rows)
    const h = html(<FamiliaCard familia={familias[0]} />)
    expect(h).toContain('2 variações')
  })
})
