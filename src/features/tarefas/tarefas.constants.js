export const STATUS = [
  { value: 'a_fazer', label: 'A fazer' },
  { value: 'fazendo', label: 'Fazendo' },
  { value: 'concluida', label: 'Concluída' },
]

export const AREAS = [
  { value: 'anuncios', label: 'Anúncios', borda: 'border-l-blue-500', chip: 'bg-blue-50 text-blue-700' },
  { value: 'estoque', label: 'Estoque', borda: 'border-l-amber-500', chip: 'bg-amber-50 text-amber-700' },
  { value: 'precificacao', label: 'Precificação', borda: 'border-l-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  { value: 'pedidos', label: 'Pedidos', borda: 'border-l-violet-500', chip: 'bg-violet-50 text-violet-700' },
  { value: 'margem', label: 'Margem', borda: 'border-l-pink-500', chip: 'bg-pink-50 text-pink-700' },
  { value: 'operacao', label: 'Operação', borda: 'border-l-slate-400', chip: 'bg-slate-100 text-slate-700' },
]

export const PRIORIDADES = [
  { value: 'alta', label: 'Alta', tone: 'rose' },
  { value: 'media', label: 'Média', tone: 'amber' },
  { value: 'baixa', label: 'Baixa', tone: 'slate' },
]

export const VISOES = [
  { value: 'kanban', label: 'Quadro' },
  { value: 'lista', label: 'Lista' },
]

export const TODOS = '__todos__'
export const SEM_RESPONSAVEL = '__sem__'

export const COLUNAS = 'id, account_id, title, description, area, priority, status, assignee, due_date, sku, created_at, completed_at'

export const FORM_VAZIO = { title: '', description: '', area: 'operacao', priority: 'media', status: 'a_fazer', assignee: '', due_date: '', sku: '' }

export const areaInfo = (v) => AREAS.find((a) => a.value === v) ?? { value: v, label: v ?? '—', borda: 'border-l-slate-300', chip: 'bg-slate-100 text-slate-600' }
export const prioridadeInfo = (v) => PRIORIDADES.find((p) => p.value === v) ?? { value: v, label: v ?? '—', tone: 'slate' }
export const statusInfo = (v) => STATUS.find((s) => s.value === v) ?? { value: v, label: v ?? '—' }
