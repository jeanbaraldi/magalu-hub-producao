export const PAGE_SIZE = 60
export const ESTOQUE_BAIXO = 5
/** Janela das vendas mostradas em cada anúncio (dias de Brasília, inclui hoje). */
export const JANELA_VENDAS_DIAS = 30

/** Abas principais, no formato da página de Anúncios do Gestor ML. */
export const ABAS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'com_custo', label: 'Com custo' },
  { value: 'sem_custo', label: 'Sem custo' },
  { value: 'nao_publicados', label: 'Não publicados' },
]

/** Sub-filtros (mostrados na aba Ativos, como no Gestor ML). */
export const SUBFILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'com_desconto', label: 'Com desconto' },
  { value: 'vendeu', label: 'Vendeu em 30d' },
  { value: 'sem_estoque', label: 'Sem estoque' },
  { value: 'estoque_baixo', label: 'Estoque baixo' },
  { value: 'full', label: 'Full' },
  { value: 'familia', label: 'Com variações' },
]

export const ORDENACOES = [
  { value: 'titulo', label: 'Título A-Z' },
  { value: 'maior_preco', label: 'Maior preço' },
  { value: 'menor_preco', label: 'Menor preço' },
  { value: 'mais_vendidos', label: 'Mais vendidos (30d)' },
  { value: 'menor_estoque', label: 'Menor estoque' },
  { value: 'maior_margem', label: 'Maior margem' },
  { value: 'menor_margem', label: 'Menor margem' },
]

// Status de SKU na spec: PUBLISHED, UNPUBLISHED, BLOCKED, UNDER_REVIEW, DELETING, DELETED.
// `NEW` aparece no portfólio real (cadastro ainda não concluído). Fora da lista aparece como veio.
export const STATUS_SKU = {
  published: { label: 'Ativo', tone: 'emerald' },
  active: { label: 'Ativo', tone: 'emerald' },
  ativo: { label: 'Ativo', tone: 'emerald' },
  unpublished: { label: 'Não publicado', tone: 'amber' },
  new: { label: 'Em cadastro', tone: 'blue' },
  under_review: { label: 'Em revisão', tone: 'amber' },
  deleting: { label: 'Excluindo', tone: 'rose' },
  deleted: { label: 'Excluído', tone: 'rose' },
  inactive: { label: 'Inativo', tone: 'slate' },
  inativo: { label: 'Inativo', tone: 'slate' },
  paused: { label: 'Pausado', tone: 'amber' },
  blocked: { label: 'Bloqueado', tone: 'rose' },
  pending: { label: 'Pendente', tone: 'amber' },
}

/** Cor da MC% — mesma régua do Gestor ML. */
export function corMargem(pct) {
  if (pct == null) return 'text-slate-400'
  if (pct >= 30) return 'text-emerald-600'
  if (pct >= 20) return 'text-blue-600'
  if (pct >= 10) return 'text-amber-600'
  if (pct >= 0) return 'text-orange-600'
  return 'text-red-600'
}
