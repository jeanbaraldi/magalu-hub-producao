export { PERIOD_OPTIONS, DEFAULT_PERIOD, CURVA_TONES, PAGE_SIZE } from '../performance/performance.constants'

export const FAIXA_FILTERS = [
  { value: 'todas', label: 'Todos' },
  { value: 'A', label: 'Lucro A' },
  { value: 'B', label: 'Lucro B' },
  { value: 'C', label: 'Lucro C' },
  { value: 'negativo', label: 'Prejuízo' },
  { value: 'pendente', label: 'Pendente' },
]

/** Motivo da pendência (vem de calcularMargem) → rótulo curto e para onde ir. */
export const MOTIVO_INFO = {
  'custo do produto': { label: 'Sem custo', rota: '/produtos' },
  'alíquota de imposto': { label: 'Sem imposto', rota: '/impostos' },
  'comissão da Magalu': { label: 'Sem comissão', rota: '/impostos' },
  'valor de item': { label: 'Item sem valor', rota: null },
  'quantidade de item': { label: 'Item sem quantidade', rota: null },
}
