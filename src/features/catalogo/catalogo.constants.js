// Constantes das telas Anúncios e Produtos (Catálogo e Diagnóstico), no formato do Gestor ML.

export const CARDS_POR_PAGINA = 24
export const PRODUTOS_POR_PAGINA = 50
export const ESTOQUE_BAIXO = 3

export const ABAS_ANUNCIOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'com_custo', label: 'Com custo' },
  { key: 'sem_custo', label: 'Sem custo' },
  { key: 'pausados', label: 'Não publicados' },
]

export const ORDENS_ANUNCIOS = [
  { key: 'vendidos', label: 'Mais vendidos' },
  { key: 'titulo', label: 'Título A-Z' },
  { key: 'maior_preco', label: 'Maior preço' },
  { key: 'menor_preco', label: 'Menor preço' },
  { key: 'menor_estoque', label: 'Menor estoque' },
  { key: 'maior_margem', label: 'Maior margem' },
]

export const ORDENS_CATALOGO = [
  { value: 'receita', label: 'Receita' },
  { value: 'contribuicao', label: 'Contribuição' },
  { value: 'margem', label: 'Margem' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'nome', label: 'Nome' },
]

/** Status de SKU da spec da Magalu → como aparece no card (mesmo desenho do status do ML). */
export const STATUS_CARD = {
  published: { label: 'Publicado', cls: 'text-emerald-700 bg-emerald-50' },
  unpublished: { label: 'Não publicado', cls: 'text-amber-700 bg-amber-50' },
  new: { label: 'Novo', cls: 'text-blue-700 bg-blue-50' },
  under_review: { label: 'Em revisão', cls: 'text-amber-700 bg-amber-50' },
  blocked: { label: 'Bloqueado', cls: 'text-red-700 bg-red-50' },
  deleting: { label: 'Excluindo', cls: 'text-red-700 bg-red-50' },
  deleted: { label: 'Excluído', cls: 'text-red-700 bg-red-50' },
}

/** Mesma régua de cor de margem do Gestor ML (performance.constants). */
export function marginColorClass(pct) {
  if (pct == null) return 'text-slate-400'
  if (pct >= 30) return 'text-emerald-600'
  if (pct >= 20) return 'text-blue-600'
  if (pct >= 10) return 'text-amber-600'
  if (pct >= 0) return 'text-orange-600'
  return 'text-red-600'
}

/** Mesma régua do getMarginRating do Gestor ML (selo de margem no Catálogo). */
export function marginRating(pct) {
  if (pct >= 30) return 'bg-emerald-100 text-emerald-600'
  if (pct >= 20) return 'bg-blue-100 text-blue-600'
  if (pct >= 10) return 'bg-yellow-100 text-yellow-600'
  if (pct >= 0) return 'bg-orange-100 text-orange-600'
  return 'bg-red-100 text-red-600'
}
