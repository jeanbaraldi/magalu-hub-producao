import { diaBrt } from '../magalu/vendas'
import { STATUS, TODOS, SEM_RESPONSAVEL, FORM_VAZIO } from './tarefas.constants'

const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 }

/** Hoje em Brasília (YYYY-MM-DD). */
export const hojeBrt = (agora = new Date()) => diaBrt(agora.toISOString())

/** Atrasada = tem prazo, o prazo já passou (dia BRT) e não está concluída. É alerta, não coluna. */
export function estaAtrasada(t, hoje) {
  return !!t.due_date && t.status !== 'concluida' && t.due_date < hoje
}

export function mapTarefa(t, hoje) {
  return { ...t, atrasada: estaAtrasada(t, hoje) }
}

/** Ordem: atrasadas primeiro, depois prioridade, prazo (sem prazo por último) e criação mais recente. */
export function ordenarTarefas(rows) {
  return [...rows].sort((a, b) =>
    (b.atrasada - a.atrasada)
    || ((ORDEM_PRIORIDADE[a.priority] ?? 9) - (ORDEM_PRIORIDADE[b.priority] ?? 9))
    || (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
    || String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
}

export function filtrarTarefas(rows, { area = TODOS, responsavel = TODOS } = {}) {
  return rows.filter((t) => {
    if (area !== TODOS && t.area !== area) return false
    if (responsavel === SEM_RESPONSAVEL) return !t.assignee
    if (responsavel !== TODOS && t.assignee !== responsavel) return false
    return true
  })
}

export function responsaveis(rows) {
  return [...new Set(rows.map((t) => t.assignee).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function agruparPorStatus(rows) {
  const grupos = Object.fromEntries(STATUS.map((s) => [s.value, []]))
  for (const t of rows) (grupos[t.status] ??= []).push(t)
  return grupos
}

/** KPIs: abertas, atrasadas, concluídas nos últimos 7 dias, sem responsável (abertas). */
export function kpisTarefas(rows, agora = new Date()) {
  const limite = agora.getTime() - 7 * 24 * 3600 * 1000
  const abertas = rows.filter((t) => t.status !== 'concluida')
  return {
    abertas: abertas.length,
    atrasadas: rows.filter((t) => t.atrasada).length,
    concluidasSemana: rows.filter((t) => t.status === 'concluida' && t.completed_at && new Date(t.completed_at).getTime() >= limite).length,
    semResponsavel: abertas.filter((t) => !t.assignee).length,
  }
}

const limpo = (v) => {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

/** Tarefa → valores do formulário (texto). */
export function tarefaParaForm(t) {
  if (!t) return { ...FORM_VAZIO }
  return {
    title: t.title ?? '', description: t.description ?? '', area: t.area ?? 'operacao',
    priority: t.priority ?? 'media', status: t.status ?? 'a_fazer',
    assignee: t.assignee ?? '', due_date: t.due_date ?? '', sku: t.sku ?? '',
  }
}

/** Valida o formulário; campo vazio vira null. */
export function validarTarefa(form) {
  const title = limpo(form.title)
  if (!title) return { erro: 'Informe o título da tarefa.', campos: null }
  if (form.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.due_date)) return { erro: 'Prazo inválido.', campos: null }
  return {
    erro: null,
    campos: {
      title, description: limpo(form.description), area: form.area || 'operacao',
      priority: form.priority || 'media', status: form.status || 'a_fazer',
      assignee: limpo(form.assignee), due_date: limpo(form.due_date), sku: limpo(form.sku),
    },
  }
}
