export const JANELA_DIAS = 30
export const COBERTURA_MIN_DIAS = 7
/** Queda: receita dos últimos 7 dias abaixo desta fração dos 7 dias anteriores. */
export const QUEDA_FRACAO = 0.5
/** Base mínima nos 7 dias anteriores para não alarmar com 1 venda. */
export const QUEDA_MIN_PEDIDOS = 3
export const SYNC_MAX_HORAS = 24

export const SEVERIDADES = [
  { value: 'critico', label: 'Crítico', descricao: 'Perde venda ou dado agora', tone: 'rose' },
  { value: 'atencao', label: 'Atenção', descricao: 'Resolver nos próximos dias', tone: 'amber' },
  { value: 'monitorar', label: 'Monitorar', descricao: 'Acompanhar', tone: 'slate' },
]

export const TEXTO_TOPO = 'Diagnóstico calculado na tela a partir dos dados já sincronizados. Ainda não há envio de aviso por WhatsApp: abra esta página para conferir.'
