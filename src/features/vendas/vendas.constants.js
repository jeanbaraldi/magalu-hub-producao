/** Releitura do espelho (rede de segurança do Realtime). */
export const REFRESH_MS = 30_000

/**
 * Puxa pedidos novos da Magalu enquanto a tela está aberta. O cron só roda a cada
 * 30 min; sem isto a tela "ao vivo" mostraria pedido com até meia hora de atraso.
 * 2 min respeita o limite por seller da API (429 é por seller e módulo).
 */
export const SYNC_MS = 120_000

/** Janela pedida ao sync ao vivo: só hoje (o filtro é por updated_at, pega mudança de status). */
export const SYNC_DIAS = 1

/** Espera depois de um evento do Realtime antes de reler (agrupa a rajada de upserts do sync). */
export const REALTIME_DEBOUNCE_MS = 1_500

/** Quantos pedidos recentes a lista mostra. */
export const RECENTES_MAX = 20

/** Tamanho do ranking de produtos do dia. */
export const RANKING_MAX = 10

/** Cores das barras por hora (Passado / Agora / Futuro), no padrão do Ao vivo da Shopee. */
export const HORA_CORES = {
  passado: '#cbd5e1',
  agora: '#0086FF',
  futuro: '#f1f5f9',
}
