// Constantes de Produtos (Catálogo e Diagnóstico), no formato do Gestor ML.

export const PRODUTOS_POR_PAGINA = 50

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

/** Mesma régua do getMarginRating do Gestor ML (selo de margem no Catálogo). */
export function marginRating(pct) {
  if (pct >= 30) return 'bg-emerald-100 text-emerald-600'
  if (pct >= 20) return 'bg-blue-100 text-blue-600'
  if (pct >= 10) return 'bg-yellow-100 text-yellow-600'
  if (pct >= 0) return 'bg-orange-100 text-orange-600'
  return 'bg-red-100 text-red-600'
}
