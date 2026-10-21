import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchInput from '../components/ui/SearchInput'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import PedidosKpiStrip from '../components/pedidos/PedidosKpiStrip'
import PedidosTable from '../components/pedidos/PedidosTable'
import { usePedidosData } from '../features/pedidos/usePedidosData'
import { filtrarPedidos } from '../features/pedidos/pedidos.mapper'
import { PERIOD_OPTIONS, STATUS_FILTERS, PAGE_SIZE } from '../features/pedidos/pedidos.constants'

export default function Pedidos() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('todos')
  const { rows, kpis, period, setPeriod, loading, error, refetch, isConnected } = usePedidosData()
  const filtrados = useMemo(() => filtrarPedidos(rows, { status, busca }), [rows, status, busca])

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Pedidos" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pedidos"
        subtitle="Pedidos da loja na Magalu, lidos do espelho sincronizado"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <ChipGroup ariaLabel="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por pedido, produto ou SKU" />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar pedidos: {error}</div>
        )}
        <PedidosKpiStrip kpis={kpis} loading={loading} />
        <PedidosTable rows={filtrados} loading={loading} pageSize={PAGE_SIZE} />
      </div>
    </div>
  )
}
