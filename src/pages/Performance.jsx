import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchInput from '../components/ui/SearchInput'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AvisoMargem from '../components/performance/AvisoMargem'
import PerformanceKpis from '../components/performance/PerformanceKpis'
import PerformanceTable from '../components/performance/PerformanceTable'
import { usePerformanceData } from '../features/performance/usePerformanceData'
import { filtrarPerformance, ordenarPerformance } from '../features/performance/performance.mapper'
import { PERIOD_OPTIONS, CURVA_FILTERS, PAGE_SIZE } from '../features/performance/performance.constants'

export default function Performance() {
  const [busca, setBusca] = useState('')
  const [curva, setCurva] = useState('todas')
  const [ordem, setOrdem] = useState({ chave: 'receita', dir: 'desc' })
  const { rows, kpis, period, setPeriod, cfg, podeVerValores, loading, error, refetch, isConnected } = usePerformanceData()
  const visiveis = useMemo(() => ordenarPerformance(filtrarPerformance(rows, { busca, curva }), ordem.chave, ordem.dir), [rows, busca, curva, ordem])
  const semCusto = useMemo(() => rows.filter((r) => r.custoUnit == null).length, [rows])
  const comissaoCompleta = useMemo(() => rows.length > 0 && rows.every((r) => r.itensSemComissao === 0), [rows])
  const freteMedido = useMemo(() => rows.some((r) => r.fonteFrete === 'magalu'), [rows])
  const ordenar = (chave) => setOrdem((o) => ({ chave, dir: o.chave === chave && o.dir === 'desc' ? 'asc' : 'desc' }))

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Performance" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Performance"
        subtitle="Receita, margem, curva ABC e tendência por SKU vendido"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <ChipGroup ariaLabel="Curva ABC" options={CURVA_FILTERS} value={curva} onChange={setCurva} />
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por produto ou SKU" />
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar performance: {error}</div>}
        <AvisoMargem podeVerValores={podeVerValores} cfg={cfg} semCusto={semCusto} comissaoCompleta={comissaoCompleta} freteMedido={freteMedido} loading={loading} />
        <PerformanceKpis kpis={kpis} podeVerValores={podeVerValores} loading={loading} />
        <PerformanceTable rows={visiveis} loading={loading} podeVerValores={podeVerValores} ordem={ordem} onOrdenar={ordenar} pageSize={PAGE_SIZE} />
        <p className="text-xs text-slate-400">Curva ABC pela receita do período (A até 80%, B até 95%). Tendência: receita dos últimos 7 dias contra os 7 anteriores (±10%).</p>
      </div>
    </div>
  )
}
