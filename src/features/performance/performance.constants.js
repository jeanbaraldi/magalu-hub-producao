export const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
]
export const DEFAULT_PERIOD = 30

/** Tendência: últimos 7 dias contra os 7 anteriores, faixa de ±10%. */
export const TENDENCIA_DIAS = 7
export const TENDENCIA_LIMIAR_PCT = 10

export const CURVA_FILTERS = [
  { value: 'todas', label: 'Todas' },
  { value: 'A', label: 'Curva A' },
  { value: 'B', label: 'Curva B' },
  { value: 'C', label: 'Curva C' },
]

export const CURVA_TONES = { A: 'emerald', B: 'blue', C: 'slate' }

export const TENDENCIA_INFO = {
  subindo: { label: 'Subindo', tone: 'emerald' },
  caindo: { label: 'Caindo', tone: 'rose' },
  estavel: { label: 'Estável', tone: 'slate' },
  novo: { label: 'Novo', tone: 'violet' },
}

export const PAGE_SIZE = 50
