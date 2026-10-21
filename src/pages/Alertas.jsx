import { CheckCircle2, RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AlertasResumo from '../components/alertas/AlertasResumo'
import AlertaGrupo from '../components/alertas/AlertaGrupo'
import { useAlertasData } from '../features/alertas/useAlertasData'
import { SEVERIDADES, TEXTO_TOPO } from '../features/alertas/alertas.constants'

const VAZIO = SEVERIDADES.map((s) => ({ ...s, itens: [] }))

export default function Alertas() {
  const d = useAlertasData()

  if (!d.isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Alertas" />
        <ConecteLoja />
      </div>
    )
  }

  const grupos = d.diagnostico?.grupos ?? VAZIO
  const total = d.diagnostico?.itens.length ?? 0
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alertas"
        subtitle="O que está pedindo atenção na loja agora"
        actions={(
          <button type="button" onClick={d.refetch} disabled={d.loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={d.loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">{TEXTO_TOPO}</div>
        {d.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao montar o diagnóstico: {d.error}</div>
        )}
        {d.avisoGestao && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">{d.avisoGestao}</div>
        )}
        <AlertasResumo grupos={grupos} loading={d.loading} />
        {d.loading && !d.diagnostico ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">Calculando diagnóstico…</div>
        ) : d.diagnostico && total === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState icon={CheckCircle2} tone="positive" title="Nada pedindo atenção" description="Nenhum alerta com os dados sincronizados agora." />
          </div>
        ) : (
          grupos.map((g) => <AlertaGrupo key={g.value} grupo={g} />)
        )}
        {d.diagnostico?.semSku > 0 && (
          <p className="text-xs text-slate-500">{d.diagnostico.semSku} item(ns) de pedido sem SKU ficaram fora da análise por produto.</p>
        )}
      </div>
    </div>
  )
}
