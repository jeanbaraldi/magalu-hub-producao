import { useState } from 'react'
import { ClipboardList, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { AREAS, PRIORIDADES, STATUS } from '../../features/tarefas/tarefas.constants'
import { tarefaParaForm, validarTarefa } from '../../features/tarefas/tarefas.mapper'

const campoCls = 'w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue'

/**
 * Criar (tarefa = null) ou editar uma tarefa. Remontar (key) a cada abertura.
 * Excluir pede confirmação nomeando a tarefa.
 */
export default function TarefaModal({ open, tarefa, pessoas, onClose, onSalvar, onExcluir }) {
  const editando = !!tarefa
  const [form, setForm] = useState(() => tarefaParaForm(tarefa))
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErro(null) }

  async function salvar(e) {
    e.preventDefault()
    const r = validarTarefa(form)
    if (!r.campos) { setErro(r.erro); return }
    setSalvando(true)
    try {
      await onSalvar(r.campos)
      onClose()
    } catch (err) {
      setErro(`Não foi possível salvar: ${err.message}`)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setSalvando(true)
    try {
      await onExcluir()
      onClose()
    } catch (err) {
      setErro(`Não foi possível excluir: ${err.message}`)
      setConfirmandoExclusao(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal open={open} onClose={salvando ? undefined : onClose} size="lg">
      <form onSubmit={salvar} className="flex flex-col min-h-0">
        <Modal.Header icon={ClipboardList} iconColor="text-white" title={editando ? 'Detalhe da tarefa' : 'Nova tarefa'} subtitle={editando && tarefa.atrasada ? 'Prazo vencido' : undefined} onClose={salvando ? undefined : onClose} />
        <Modal.Body className="space-y-4">
          <div>
            <label htmlFor="t-titulo" className="text-sm font-semibold text-slate-700">Título *</label>
            <input id="t-titulo" className={`${campoCls} mt-1`} value={form.title} onChange={set('title')} maxLength={200} />
          </div>
          <div>
            <label htmlFor="t-desc" className="text-sm font-semibold text-slate-700">Descrição</label>
            <textarea id="t-desc" rows={3} className="w-full mt-1 rounded-xl border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="t-situacao" className="text-sm font-semibold text-slate-700">Situação</label>
              <select id="t-situacao" className={`${campoCls} mt-1`} value={form.status} onChange={set('status')}>
                {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="t-area" className="text-sm font-semibold text-slate-700">Área</label>
              <select id="t-area" className={`${campoCls} mt-1`} value={form.area} onChange={set('area')}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="t-prio" className="text-sm font-semibold text-slate-700">Prioridade</label>
              <select id="t-prio" className={`${campoCls} mt-1`} value={form.priority} onChange={set('priority')}>
                {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="t-resp" className="text-sm font-semibold text-slate-700">Responsável</label>
              <input id="t-resp" list="t-pessoas" className={`${campoCls} mt-1`} value={form.assignee} onChange={set('assignee')} placeholder="Sem responsável" />
              <datalist id="t-pessoas">{pessoas.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label htmlFor="t-prazo" className="text-sm font-semibold text-slate-700">Prazo</label>
              <input id="t-prazo" type="date" className={`${campoCls} mt-1`} value={form.due_date} onChange={set('due_date')} />
            </div>
            <div>
              <label htmlFor="t-sku" className="text-sm font-semibold text-slate-700">SKU (opcional)</label>
              <input id="t-sku" className={`${campoCls} mt-1 font-mono`} value={form.sku} onChange={set('sku')} />
            </div>
          </div>
          {erro && <p role="alert" className="text-sm text-rose-700">{erro}</p>}
          {confirmandoExclusao && (
            <div role="alertdialog" className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-800 space-y-2">
              <p>Excluir a tarefa <strong>“{tarefa.title}”</strong>? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={excluir} loading={salvando}>Excluir de vez</Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmandoExclusao(false)} disabled={salvando}>Cancelar</Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-between">
          <div>
            {editando && !confirmandoExclusao && (
              <Button variant="ghost" icon={Trash2} onClick={() => setConfirmandoExclusao(true)} disabled={salvando} className="text-rose-600 hover:bg-rose-50">Excluir</Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={salvando}>Cancelar</Button>
            <Button type="submit" loading={salvando && !confirmandoExclusao}>{editando ? 'Salvar' : 'Criar tarefa'}</Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
