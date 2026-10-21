import { Link } from 'react-router-dom'
import { RefreshCw, LayoutDashboard } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import { dataHora } from '../components/magalu/formatos'
import DashboardKpis from '../components/dashboard/DashboardKpis'
import ReceitaDiariaChart from '../components/dashboard/ReceitaDiariaChart'
import { useDashboardData } from '../features/dashboard/useDashboardData'
import { PERIOD_OPTIONS } from '../features/pedidos/pedidos.constants'

export default function Dashboard() {
  const { vm, dias, setDias, ultimaSync, vazio, loading, error, refetch, isConnected } = useDashboardData()

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={ultimaSync?.finished_at ? `Pedidos sincronizados em ${dataHora(ultimaSync.finished_at)}` : 'Visão geral da loja na Magalu'}
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={dias} onChange={setDias} />
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar o dashboard: {error}</div>
        )}
        {ultimaSync?.error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            A última sincronização de pedidos falhou: {ultimaSync.error}
          </div>
        )}
        {vazio && !loading ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={LayoutDashboard}
              title="Ainda não há dados sincronizados"
              description="A loja está conectada, mas nenhum pedido ou SKU foi lido ainda."
              action={<Link to="/configuracoes" className="text-sm font-semibold text-mg-blue hover:underline">Sincronizar agora</Link>}
            />
          </div>
        ) : (
          <>
            <DashboardKpis kpis={vm.kpis} dias={dias} loading={loading} />
            <ReceitaDiariaChart serie={vm.serie} />
          </>
        )}
      </div>
    </div>
  )
}
