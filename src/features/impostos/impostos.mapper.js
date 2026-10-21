import { REGIMES } from './impostos.constants'

/** Número com vírgula ou ponto. Vazio → null; inválido → NaN. */
export function parsePct(texto) {
  const s = String(texto ?? '').replace('%', '').trim()
  if (s === '') return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : Number.NaN
}

const paraTexto = (v) => (v == null ? '' : String(Number(v)).replace('.', ','))

export function aliquotaSugerida(regime) {
  return REGIMES.find((r) => r.value === regime)?.aliquota ?? null
}

/** Configuração salva → valores do formulário (texto). Nulo vira campo vazio. */
export function cfgParaForm(cfg) {
  return {
    regime: cfg?.tax_regime ?? '',
    imposto: paraTexto(cfg?.tax_pct),
    comissao: paraTexto(cfg?.commission_pct),
    frete: paraTexto(cfg?.freight_pct),
  }
}

/**
 * Valida o formulário. Todo percentual precisa estar em [0, 100).
 * Campo vazio é aceito e gravado como NULL ("não informado"), nunca como zero.
 * @returns {{ erros: Record<string,string>, campos: object|null }}
 */
export function validarForm(form) {
  const erros = {}
  const ler = (chave) => {
    const n = parsePct(form[chave])
    if (Number.isNaN(n)) { erros[chave] = 'Número inválido'; return null }
    if (n != null && (n < 0 || n >= 100)) { erros[chave] = 'Use um valor de 0 a 99,99'; return null }
    return n
  }
  const tax_pct = ler('imposto')
  const commission_pct = ler('comissao')
  const freight_pct = ler('frete')
  const regime = form.regime || null
  if (regime && !REGIMES.some((r) => r.value === regime)) erros.regime = 'Regime inválido'
  if (Object.keys(erros).length > 0) return { erros, campos: null }
  return { erros, campos: { tax_regime: regime, tax_pct, commission_pct, freight_pct } }
}

/** Resumo para leitura: percentual formatado ou "não informado". */
export function descreverPct(v) {
  return v == null ? 'não informado' : `${String(Number(v)).replace('.', ',')}%`
}
