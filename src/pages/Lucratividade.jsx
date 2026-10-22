import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchInput from '../components/ui/SearchInput'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AvisoMargem from '../components/performance/AvisoMargem'
import LucroKpis from '../components/lucratividade/LucroKpis'
import LucroComposicao from '../components/lucratividade/LucroComposicao'
import MatrizReceitaLucro from '../components/lucratividade/MatrizReceitaLucro'
import PendenciasLucro from '../components/lucratividade/PendenciasLucro'
import LucroTable from '../components/lucratividade/LucroTable'
import { useLucratividadeData } from '../features/lucratividade/useLucratividadeData'
import { filtrarLucratividade } from '../features/lucratividade/lucratividade.mapper'
import { PERIOD_OPTIONS, FAIXA_FILTERS, PAGE_SIZE } from '../features/lucratividade/lucratividade.constants'

export default function Lucratividade() {
  const [busca, setBusca] = useState('')
  const [faixa, setFaixa] = useState('todas')
  const { rows, kpis, composicao, matriz, pendencias, period, setPeriod, cfg, podeVerValores, loading, error, refetch, isConnected } = useLucratividadeData()
  const visiveis = useMemo(() => filtrarLucratividade(rows, { busca, faixa }), [rows, busca, faixa])
  const semCusto = useMemo(() => rows.filter((r) => r.custoUnit == null).length, [rows])
  const comissaoCompleta = useMemo(() => rows.length > 0 && rows.every((r) => r.itensSemComissao === 0), [rows])
  const freteMedido = useMemo(() => rows.some((r) => r.fonteFrete === 'magalu' || r.fonteFrete === 'estimado'), [rows])

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Lucratividade" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Lucratividade"
        subtitle="Quem deixa mais dinheiro: curva ABC pela margem de contribuição"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar lucratividade: {error}</div>}
        <AvisoMargem podeVerValores={podeVerValores} cfg={cfg} semCusto={semCusto} comissaoCompleta={comissaoCompleta} freteMedido={freteMedido} loading={loading} />
        {!loading && podeVerValores && (
          <>
            <LucroKpis kpis={kpis} loading={loading} />
            <PendenciasLucro pendencias={pendencias} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <LucroComposicao composicao={composicao} />
              <div className="lg:col-span-2"><MatrizReceitaLucro matriz={matriz} /></div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ChipGroup ariaLabel="Faixa" options={FAIXA_FILTERS} value={faixa} onChange={setFaixa} />
              <div className="flex-1 min-w-[200px]">
                <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por produto ou SKU" />
              </div>
            </div>
            <LucroTable rows={visiveis} loading={loading} pageSize={PAGE_SIZE} />
          </>
        )}
        {loading && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando lucratividade…</div>}
      </div>
    </div>
  )
}
