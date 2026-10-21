export { PERIOD_OPTIONS, DEFAULT_PERIOD, CURVA_FILTERS, CURVA_TONES, PAGE_SIZE } from '../performance/performance.constants'

export const METRICA_OPTIONS = [
  { value: 'receita', label: 'Por receita' },
  { value: 'unidades', label: 'Por unidades' },
]
export const DEFAULT_METRICA = 'receita'

export const MOVIMENTO_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'subiu', label: 'Subiu' },
  { value: 'desceu', label: 'Desceu' },
  { value: 'novo', label: 'Novo' },
]

export const MOVIMENTO_INFO = {
  subiu: { label: 'Subiu', tone: 'emerald' },
  desceu: { label: 'Desceu', tone: 'rose' },
  manteve: { label: 'Manteve', tone: 'slate' },
  novo: { label: 'Novo', tone: 'violet' },
}

export const CURVA_CORES = { A: '#10b981', B: '#0086FF', C: '#94a3b8' }
