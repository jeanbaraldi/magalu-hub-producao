import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AvisoMargem from '../components/performance/AvisoMargem'
import LucroResumo from '../components/rentabilidade/LucroResumo'
import DreCascata from '../components/rentabilidade/DreCascata'
import ReceitaLucroChart from '../components/rentabilidade/ReceitaLucroChart'
import ComposicaoDonut from '../components/rentabilidade/ComposicaoDonut'
import { useRentabilidadeData } from '../features/rentabilidade/useRentabilidadeData'
import { PERIOD_OPTIONS } from '../features/rentabilidade/rentabilidade.constants'

export default function Rentabilidade() {
  const { dre, cascata, diario, composicao, period, setPeriod, cfg, podeVerValores, loading, error, refetch, isConnected } = useRentabilidadeData()
  const semCusto = dre.cobertura.skusComCusto == null ? 0 : dre.cobertura.skusVendidos - dre.cobertura.skusComCusto

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Rentabilidade" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rentabilidade"
        subtitle="DRE simplificado da loja: da receita ao lucro"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar rentabilidade: {error}</div>}
        <AvisoMargem podeVerValores={podeVerValores} cfg={cfg} semCusto={semCusto} loading={loading} />
        <LucroResumo dre={dre} loading={loading} />
        {!loading && (
          <>
            <DreCascata passos={cascata} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2"><ReceitaLucroChart diario={diario} lucroDisponivel={dre.completo} /></div>
              <ComposicaoDonut composicao={composicao} dre={dre} />
            </div>
          </>
        )}
        <p className="text-xs text-slate-400">Comissão, imposto e frete são percentuais sobre a receita, configurados em Impostos; custo é o cadastrado em Produtos × unidades vendidas. O lucro só aparece quando todos os componentes obrigatórios são conhecidos para todo o período.</p>
      </div>
    </div>
  )
}
