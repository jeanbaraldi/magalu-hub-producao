export const HORIZON_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
]
export const DEFAULT_HORIZON = 15
/** Base da previsão: 90 dias FECHADOS de Brasília (termina ontem; hoje parcial fica fora). */
export const DIAS_BASE = 90
/** Meia-vida (dias) do peso por recência na média diária. */
export const MEIA_VIDA = 21
/** Dias usados para medir a dispersão (desvio padrão) dos resíduos. */
export const JANELA_DISPERSAO = 28
/** Dias do backtest (holdout no fim da base). */
export const DIAS_BACKTEST = 14
/** Mínimo de dias com venda no holdout para o MAPE ter sentido. */
export const MIN_DIAS_MAPE = 5
/** z ≈ 1,28: faixa de ~80% sob hipótese normal. */
export const Z_FAIXA = 1.28
/** Encolhimento dos índices de dia da semana rumo a 1 (pseudo-ocorrências). */
export const ENCOLHIMENTO_SEMANA = 2
