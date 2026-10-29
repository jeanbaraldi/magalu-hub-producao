import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import VendasAoVivoHero from './VendasAoVivoHero'

const base = {
  receita: 1500, pedidos: 3, unidades: 4, ticket: 500, semValor: 0, semQtd: 0, cancelados: 0,
  ultimaVenda: '2026-10-21T23:27:00Z', variacao: { receita: 34.9 },
}

describe('VendasAoVivoHero', () => {
  it('mostra receita, variação e última venda', () => {
    const html = renderToString(<VendasAoVivoHero kpis={base} loading={false} sincronizadoEm={new Date('2026-10-21T23:30:00Z')} onAtualizar={() => {}} />)
    expect(html).toContain('Vendas ao vivo')
    expect(html).toContain('+34,9% vs ontem até agora')
    expect(html).toContain('última venda 20:27')
    expect(html).toContain('Pedidos buscados na Magalu às 20:30')
  })

  it('valor desconhecido vira "—" e erro do sync é dito, sem quebrar', () => {
    const kpis = { ...base, receita: null, ticket: null, unidades: null, ultimaVenda: null, variacao: { receita: null }, semValor: 2 }
    const html = renderToString(<VendasAoVivoHero kpis={kpis} loading={false} erroSync="HTTP 429" onAtualizar={() => {}} />)
    expect(html).toContain('sem base ontem até este horário')
    expect(html).toContain('sem vendas ainda')
    expect(html).toContain('2 pedido(s) sem valor legível')
    expect(html).toContain('HTTP 429')
    expect(html).not.toContain('R$ 0,00')
  })
})
