export const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
]
export const DEFAULT_PERIOD = 30
export const PAGE_SIZE = 50

// Rótulos dos status da Magalu. NÃO VALIDADO contra a doc: status desconhecido
// aparece como veio (Title Case), nunca é escondido nem trocado por outro.
export const STATUS_LABELS = {
  new: { label: 'Novo', tone: 'slate' },
  approved: { label: 'Aprovado', tone: 'blue' },
  invoiced: { label: 'Faturado', tone: 'blue' },
  shipped: { label: 'Enviado', tone: 'violet' },
  delivered: { label: 'Entregue', tone: 'emerald' },
  finished: { label: 'Concluído', tone: 'emerald' },
  canceled: { label: 'Cancelado', tone: 'rose' },
  cancelled: { label: 'Cancelado', tone: 'rose' },
  unpaid: { label: 'Não pago', tone: 'amber' },
  pending_payment: { label: 'Aguardando pagamento', tone: 'amber' },
}

export const STATUS_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'cancelados', label: 'Cancelados' },
]
