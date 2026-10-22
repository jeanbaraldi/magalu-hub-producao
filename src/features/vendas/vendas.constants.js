/** Releitura do espelho (rede de segurança do Realtime). */
export const REFRESH_MS = 30_000

/**
 * Intervalo mínimo entre duas buscas na Magalu disparadas pela tela (ao abrir). A busca
 * contínua é do cron `magalu-sync-pedidos-ao-vivo`, a cada minuto; o botão Atualizar força.
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
