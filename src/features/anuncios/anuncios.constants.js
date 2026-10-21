export const PAGE_SIZE = 60
export const ESTOQUE_BAIXO = 5

export const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'sem_estoque', label: 'Sem estoque' },
  { value: 'estoque_baixo', label: 'Estoque baixo' },
  { value: 'inativos', label: 'Inativos' },
]

// Status de SKU na spec: PUBLISHED, UNPUBLISHED, BLOCKED, UNDER_REVIEW, DELETING, DELETED.
// Fora desta lista aparece como veio.
export const STATUS_SKU = {
  unpublished: { label: 'Não publicado', tone: 'slate' },
  under_review: { label: 'Em revisão', tone: 'amber' },
  deleting: { label: 'Excluindo', tone: 'rose' },
  deleted: { label: 'Excluído', tone: 'rose' },
  active: { label: 'Ativo', tone: 'emerald' },
  ativo: { label: 'Ativo', tone: 'emerald' },
  published: { label: 'Publicado', tone: 'emerald' },
  inactive: { label: 'Inativo', tone: 'slate' },
  inativo: { label: 'Inativo', tone: 'slate' },
  paused: { label: 'Pausado', tone: 'amber' },
  blocked: { label: 'Bloqueado', tone: 'rose' },
  pending: { label: 'Pendente', tone: 'amber' },
}
