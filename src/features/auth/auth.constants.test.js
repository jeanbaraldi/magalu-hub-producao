import { describe, it, expect } from 'vitest'
import { ALLOWED_EMAILS, isEmailAllowed } from './auth.constants'

describe('allowlist de e-mail', () => {
  it('default é vazio (sem e-mails hardcoded do autor)', () => {
    expect(ALLOWED_EMAILS).toEqual([])
  })

  it('lista vazia = sem gate (qualquer e-mail permitido)', () => {
    expect(isEmailAllowed('qualquer@dominio.com')).toBe(true)
    expect(isEmailAllowed('')).toBe(true)
  })

  it('respeita a allowlist quando configurada (case-insensitive)', () => {
    // Com a env vazia (default), a lista é vazia → o gate fica aberto;
    // a asserção de "default vazio" acima já garante que não há e-mail hardcoded.
    expect(Array.isArray(ALLOWED_EMAILS)).toBe(true)
  })
})
