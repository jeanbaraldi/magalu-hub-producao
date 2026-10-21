import { describe, it, expect } from 'vitest'
import { parsePct, cfgParaForm, validarForm, aliquotaSugerida, descreverPct } from './impostos.mapper'

describe('impostos.mapper', () => {
  it('sugere a alíquota do regime', () => {
    expect(aliquotaSugerida('simples')).toBe(8)
    expect(aliquotaSugerida('manual')).toBeNull()
  })
  it('nulo vira campo vazio e não zero', () => {
    expect(cfgParaForm({ tax_regime: 'mei', tax_pct: 3, commission_pct: null, freight_pct: 2.5 }))
      .toEqual({ regime: 'mei', imposto: '3', comissao: '', frete: '2,5' })
    expect(cfgParaForm(null).imposto).toBe('')
  })
  it('valida faixa 0 ≤ x < 100 e grava vazio como null', () => {
    const ok = validarForm({ regime: 'presumido', imposto: '11,33', comissao: '16', frete: '' })
    expect(ok.campos).toEqual({ tax_regime: 'presumido', tax_pct: 11.33, commission_pct: 16, freight_pct: null })
    const ruim = validarForm({ regime: '', imposto: '100', comissao: 'abc', frete: '-1' })
    expect(ruim.campos).toBeNull()
    expect(Object.keys(ruim.erros).sort()).toEqual(['comissao', 'frete', 'imposto'])
  })
  it('parsePct e descreverPct', () => {
    expect(parsePct('')).toBeNull()
    expect(parsePct('12,5%')).toBe(12.5)
    expect(descreverPct(null)).toBe('não informado')
    expect(descreverPct(8)).toBe('8%')
  })
})
