import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import TarefasKpis from '../components/tarefas/TarefasKpis'
import TarefasFiltros from '../components/tarefas/TarefasFiltros'
import TarefasKanban from '../components/tarefas/TarefasKanban'
import TarefasLista from '../components/tarefas/TarefasLista'
import TarefaModal from '../components/tarefas/TarefaModal'
import { useTarefasData } from '../features/tarefas/useTarefasData'
import { filtrarTarefas, agruparPorStatus } from '../features/tarefas/tarefas.mapper'
import { VISOES, TODOS } from '../features/tarefas/tarefas.constants'

export default function Tarefas() {
  const d = useTarefasData()
  const [visao, setVisao] = useState('kanban')
  const [area, setArea] = useState(TODOS)
  const [responsavel, setResponsavel] = useState(TODOS)
  // modal: null = fechado; { id: null } = nova; { id } = detalhe
  const [modal, setModal] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)

  // A exclusão é otimista: fecha o detalhe já e avisa na página se o banco recusar.
  async function excluir(id) {
    setModal(null)
    setErroAcao(null)
    try { await d.excluir(id) } catch (e) { setErroAcao(`Não foi possível excluir a tarefa: ${e.message}`) }
  }

  const filtradas = useMemo(() => filtrarTarefas(d.rows, { area, responsavel }), [d.rows, area, responsavel])
  const grupos = useMemo(() => agruparPorStatus(filtradas), [filtradas])
  // Lê a tarefa da lista viva pelo id (guardar o objeto mostraria o estado de antes da edição).
  const aberta = modal?.id ? d.rows.find((t) => t.id === modal.id) ?? null : null

  if (!d.isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Tarefas" />
        <ConecteLoja />
      </div>
    )
  }

  const btn = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50'
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tarefas"
        subtitle="O que a equipe precisa fazer na loja"
        actions={(
          <>
            <button type="button" onClick={d.refetch} disabled={d.loading} className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-50`}>
              <RefreshCw aria-hidden="true" size={14} className={d.loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button type="button" onClick={() => setModal({ id: null })} className={`${btn} bg-mg-blue hover:bg-mg-blue-dark text-white`}>
              <Plus aria-hidden="true" size={14} /> Nova tarefa
            </button>
          </>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {d.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar tarefas: {d.error}</div>
        )}
        {erroAcao && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erroAcao}</div>
        )}
        <TarefasKpis kpis={d.kpis} loading={d.loading} />
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <TarefasFiltros area={area} onArea={setArea} responsavel={responsavel} onResponsavel={setResponsavel} pessoas={d.pessoas} />
          <ChipGroup ariaLabel="Visão" options={VISOES} value={visao} onChange={setVisao} />
        </div>
        {d.loading && d.rows.length === 0
          ? <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando tarefas…</div>
          : visao === 'kanban'
            ? <TarefasKanban grupos={grupos} onAbrir={(t) => setModal({ id: t.id })} />
            : <TarefasLista rows={filtradas} onAbrir={(t) => setModal({ id: t.id })} />}
      </div>
      {modal && (modal.id === null || aberta) && (
        <TarefaModal
          key={modal.id ?? 'nova'}
          open
          tarefa={aberta}
          pessoas={d.pessoas}
          onClose={() => setModal(null)}
          onSalvar={(campos) => (aberta ? d.atualizar(aberta.id, campos) : d.criar(campos))}
          onExcluir={() => excluir(aberta.id)}
        />
      )}
    </div>
  )
}
