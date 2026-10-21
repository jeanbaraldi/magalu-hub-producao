import { supabase } from '../../lib/supabase'

const PAGINA = 1000

/**
 * Lê uma tabela do schema magalu inteira, paginando com ORDEM TOTAL.
 * `.range()` sem ordem estável pula/duplica linhas, e o PostgREST corta em 1000.
 * @param {(q: any) => any} montar recebe o select e devolve a query filtrada e ordenada
 */
export async function lerTudo(tabela, colunas, montar) {
  const linhas = []
  for (let de = 0; de < 200_000; de += PAGINA) {
    const q = montar(supabase.from(tabela).select(colunas)).range(de, de + PAGINA - 1)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    linhas.push(...(data ?? []))
    if (!data || data.length < PAGINA) return linhas
  }
  throw new Error(`${tabela}: mais de 200 mil linhas, leitura interrompida para não exibir número truncado`)
}

/** Última sincronização registrada por tipo (skus/orders) da loja. */
export async function ultimaSincronizacao(accountId, kind) {
  const { data, error } = await supabase
    .from('sync_runs')
    .select('kind, finished_at, fetched, truncated, error')
    .eq('account_id', accountId)
    .eq('kind', kind)
    .order('finished_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

/**
 * Pedidos da loja num intervalo [desde, ate) por `purchased_at`, com ordem total.
 * `ate` opcional (sem ele lê até agora). Inclui o payload: os itens vêm dele.
 */
export function lerPedidos(accountId, desdeIso, ateIso = null) {
  return lerTudo('orders', 'order_id, status, purchased_at, total_amount, items_count, payload', (q) => {
    let f = q.eq('account_id', accountId).gte('purchased_at', desdeIso)
    if (ateIso) f = f.lt('purchased_at', ateIso)
    return f.order('purchased_at', { ascending: false }).order('order_id', { ascending: true })
  })
}

/** Catálogo (SKUs) da loja, ordenado por SKU. */
export function lerSkus(accountId) {
  return lerTudo('skus', 'sku, title, status, price, list_price, stock, image_url, synced_at',
    (q) => q.eq('account_id', accountId).order('sku', { ascending: true }))
}
