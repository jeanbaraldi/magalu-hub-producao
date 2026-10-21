import { describe, it, expect } from 'vitest'
import { mapTarefa, ordenarTarefas, filtrarTarefas, responsaveis, agruparPorStatus, kpisTarefas, validarTarefa, tarefaParaForm } from './tarefas.mapper'
import { SEM_RESPONSAVEL, TODOS } from './tarefas.constants'

const hoje = '2026-10-21'
const t = (id, extra) => mapTarefa({ id, title: id, area: 'operacao', priority: 'media', status: 'a_fazer', assignee: null, due_date: null, created_at: '2026-10-01T00:00:00Z', completed_at: null, ...extra }, hoje)

describe('tarefas.mapper', () => {
  it('atrasada só com prazo vencido e não concluída', () => {
    expect(t('a', { due_date: '2026-10-20' }).atrasada).toBe(true)
    expect(t('b', { due_date: '2026-10-21' }).atrasada).toBe(false)
    expect(t('c', { due_date: '2026-10-20', status: 'concluida' }).atrasada).toBe(false)
    expect(t('d').atrasada).toBe(false)
  })
  it('ordena atrasadas e prioridade primeiro', () => {
    const rows = [t('baixa', { priority: 'baixa' }), t('alta', { priority: 'alta' }), t('atr', { due_date: '2026-10-01', priority: 'baixa' })]
    expect(ordenarTarefas(rows).map((x) => x.id)).toEqual(['atr', 'alta', 'baixa'])
  })
  it('filtra por área, responsável e sem responsável', () => {
    const rows = [t('a', { assignee: 'Ana', area: 'estoque' }), t('b'), t('c', { assignee: 'Bia' })]
    expect(filtrarTarefas(rows, { responsavel: SEM_RESPONSAVEL }).map((x) => x.id)).toEqual(['b'])
    expect(filtrarTarefas(rows, { area: 'estoque', responsavel: TODOS }).map((x) => x.id)).toEqual(['a'])
    expect(filtrarTarefas(rows, { responsavel: 'Bia' }).map((x) => x.id)).toEqual(['c'])
    expect(responsaveis(rows)).toEqual(['Ana', 'Bia'])
  })
  it('agrupa e calcula KPIs', () => {
    const agora = new Date('2026-10-21T15:00:00Z')
    const rows = [
      t('a', { due_date: '2026-10-01' }),
      t('b', { status: 'fazendo', assignee: 'Ana' }),
      t('c', { status: 'concluida', completed_at: '2026-10-20T10:00:00Z' }),
      t('d', { status: 'concluida', completed_at: '2026-09-01T10:00:00Z' }),
    ]
    expect(agruparPorStatus(rows).concluida.map((x) => x.id)).toEqual(['c', 'd'])
    expect(kpisTarefas(rows, agora)).toEqual({ abertas: 2, atrasadas: 1, concluidasSemana: 1, semResponsavel: 1 })
  })
  it('valida e limpa o formulário', () => {
    expect(validarTarefa({ ...tarefaParaForm(null), title: '  ' }).erro).toBeTruthy()
    const r = validarTarefa({ ...tarefaParaForm(null), title: ' Repor estoque ', assignee: ' ', sku: 'A1' })
    expect(r.campos).toMatchObject({ title: 'Repor estoque', assignee: null, due_date: null, sku: 'A1', status: 'a_fazer' })
  })
})
