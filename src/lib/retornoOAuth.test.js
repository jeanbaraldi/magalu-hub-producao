import { describe, it, expect, vi } from 'vitest'
import { abaDeOrigem, repassarCodigoAoPainel, MSG_CODIGO_OAUTH } from './retornoOAuth'

function janela({ search = '', opener } = {}) {
  return {
    location: { search, pathname: '/', origin: 'https://app.test' },
    opener,
    history: { replaceState: vi.fn() },
    document: { body: { innerHTML: '' } },
    close: vi.fn(),
  }
}

describe('retorno do OAuth para o painel embutido', () => {
  it('repassa o code à aba de mesma origem que abriu', () => {
    const painel = { closed: false, location: { origin: 'https://app.test' }, postMessage: vi.fn() }
    const w = janela({ search: '?code=abc', opener: painel })
    expect(repassarCodigoAoPainel(w)).toBe(true)
    expect(painel.postMessage).toHaveBeenCalledWith({ type: MSG_CODIGO_OAUTH, code: 'abc' }, 'https://app.test')
  })

  it('sem aba de origem, segue o fluxo normal', () => {
    expect(repassarCodigoAoPainel(janela({ search: '?code=abc' }))).toBe(false)
  })

  it('aba de outro site não recebe o code', () => {
    const outro = { closed: false, get location() { throw new Error('cross-origin') }, postMessage: vi.fn() }
    expect(abaDeOrigem(janela({ opener: outro }))).toBe(null)
    expect(repassarCodigoAoPainel(janela({ search: '?code=abc', opener: outro }))).toBe(false)
  })

  it('sem code não faz nada', () => {
    const painel = { closed: false, location: { origin: 'https://app.test' }, postMessage: vi.fn() }
    expect(repassarCodigoAoPainel(janela({ opener: painel }))).toBe(false)
  })
})
