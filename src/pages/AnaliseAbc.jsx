import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchInput from '../components/ui/SearchInput'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AbcComposicao from '../components/analiseAbc/AbcComposicao'
import AbcMovimento from '../components/analiseAbc/AbcMovimento'
import ParetoChart from '../components/analiseAbc/ParetoChart'
import AbcTable from '../components/analiseAbc/AbcTable'
import { useAnaliseAbcData } from '../features/analiseAbc/useAnaliseAbcData'
import { filtrarAbc } from '../features/analiseAbc/analiseAbc.mapper'
import { PERIOD_OPTIONS, METRICA_OPTIONS, CURVA_FILTERS, MOVIMENTO_FILTERS, PAGE_SIZE } from '../features/analiseAbc/analiseAbc.constants'

export default function AnaliseAbc() {
  const [busca, setBusca] = useState('')
  const [curva, setCurva] = useState('todas')
  const [mov, setMov] = useState('todos')
  const { rows, composicao, pareto, resumo, period, setPeriod, metrica, setMetrica, loading, error, refetch, isConnected } = useAnaliseAbcData()
  const visiveis = useMemo(() => filtrarAbc(rows, { busca, curva, movimento: mov }), [rows, busca, curva, mov])

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Análise ABC" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Análise ABC"
        subtitle="Quais SKUs concentram as vendas e como mudaram de classe"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <ChipGroup ariaLabel="Métrica da curva" options={METRICA_OPTIONS} value={metrica} onChange={setMetrica} />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar a análise: {error}</div>}
        <AbcComposicao composicao={composicao} resumo={resumo} metrica={metrica} loading={loading} />
        <ParetoChart pareto={pareto} metrica={metrica} />
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-2">{`Comparação com os ${period} dias anteriores`}</h2>
          <AbcMovimento resumo={resumo} loading={loading} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Curva" options={CURVA_FILTERS} value={curva} onChange={setCurva} />
          <ChipGroup ariaLabel="Movimento" options={MOVIMENTO_FILTERS} value={mov} onChange={setMov} />
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por produto ou SKU" />
          </div>
        </div>
        <AbcTable rows={visiveis} metrica={metrica} loading={loading} pageSize={PAGE_SIZE} />
        <p className="text-xs text-slate-400">O SKU que cruza 80% ainda é A; o que cruza 95% ainda é B. Busca e filtros só escondem linhas: a classificação é sempre sobre todos os SKUs do período.</p>
      </div>
    </div>
  )
}
