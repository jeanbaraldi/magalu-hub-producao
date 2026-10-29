import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import AnuncioCard from './AnuncioCard'
import CatalogoList from './CatalogoList'
import CatalogoKpis from './CatalogoKpis'
import DiagnosticoPanel from './diagnostico/DiagnosticoPanel'
import { mapCatalogo, contarAbas, totaisCatalogo } from '../../features/catalogo/catalogo.mapper'
import { buildDiagnostico, vendasPorDia } from '../../features/catalogo/diagnostico.mapper'

const skus = [
  { sku: 'KIT-01', title: 'Kit Exemplo', status: 'PUBLISHED', price: 100, list_price: 120, stock: 0, images: [] },
  { sku: 'SEM-01', title: 'Sem Custo', status: 'UNPUBLISHED', price: null, stock: null, images: [] },
]
const cfg = { aliquota: 10, fretePct: 5, comissaoPct: null }
const vendas = new Map([['KIT-01', { unidades: 4, receita: 400, comissao: 40, itensSemComissao: 0 }]])

describe('telas do catálogo renderizam com dado real, nulo e vazio', () => {
  const rows = mapCatalogo(skus, new Map([['KIT-01', 50]]), vendas, cfg, { podeVerValores: true })

  it('card de anúncio mostra o SKU e trata preço desconhecido como —', () => {
    const html = renderToString(<AnuncioCard row={rows[1]} podeVerValores />)
    expect(html).toContain('SEM-01')
    expect(html).toContain('—')
  })

  it('lista e KPIs do catálogo', () => {
    const html = renderToString(
      <>
        <CatalogoKpis totais={totaisCatalogo(rows)} podeVerValores />
        <CatalogoList rows={rows} counts={contarAbas(rows)} aba="todos" onAba={() => {}} ordem="receita" onOrdem={() => {}}
          busca="" onBusca={() => {}} loading={false} error={null} podeVerValores />
      </>,
    )
    expect(html).toContain('Kit Exemplo')
    expect(html).toContain('Sem custo cadastrado')
  })

  it('diagnóstico vazio e com sinal', () => {
    const vazio = renderToString(<MemoryRouter><DiagnosticoPanel rows={[]} loading={false} error={null} desde={null} podeVerValores onRefresh={() => {}} /></MemoryRouter>)
    expect(vazio).toContain('Nenhum sinal na loja hoje')
    const pedidos = Array.from({ length: 5 }, (_, i) => ({
      purchased_at: `2026-10-${String(20 + i).padStart(2, '0')}T15:00:00Z`, status: 'approved',
      payload: { deliveries: [{ status: 'approved', items: [{ info: { sku: 'KIT-01' }, quantity: 1, unit_price: { value: 10000, normalizer: 100 } }] }] },
    }))
    const diag = buildDiagnostico(rows, vendasPorDia(pedidos), '2026-10-29', '2026-09-01')
    const html = renderToString(<MemoryRouter><DiagnosticoPanel rows={diag} loading={false} error={null} desde="2026-09-01" podeVerValores onRefresh={() => {}} /></MemoryRouter>)
    expect(diag.length).toBeGreaterThan(0)
    expect(html).toContain('KIT-01')
  })
})
