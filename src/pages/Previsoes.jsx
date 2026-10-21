import { RefreshCw, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import PrevisaoKpis from '../components/previsoes/PrevisaoKpis'
import PrevisaoChart from '../components/previsoes/PrevisaoChart'
import PrevisaoSkuTable from '../components/previsoes/PrevisaoSkuTable'
import { usePrevisoesData } from '../features/previsoes/usePrevisoesData'
import { HORIZON_OPTIONS } from '../features/previsoes/previsoes.constants'

const br = (dia) => (dia ? `${dia.slice(8, 10)}/${dia.slice(5, 7)}` : '—')

export default function Previsoes() {
  const { vm, horizonte, setHorizonte, loading, error, refetch, isConnected } = usePrevisoesData()

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Previsões" />
        <ConecteLoja />
      </div>
    )
  }

  const d = vm.declarados
  const avisos = [
    d.itensSemQtd > 0 && `${d.itensSemQtd} item(ns) sem quantidade legível`,
    d.pedidosSemItens > 0 && `${d.pedidosSemItens} pedido(s) sem itens legíveis`,
    d.itensSemSku > 0 && `${d.itensSemSku} item(ns) sem SKU (entram no total, não na tabela por SKU)`,
  ].filter(Boolean)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Previsões"
        subtitle="Demanda projetada em unidades, a partir das vendas dos últimos 90 dias"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Horizonte" options={HORIZON_OPTIONS} value={horizonte} onChange={setHorizonte} />
          <span className="text-xs text-slate-500">{`Base: ${br(vm.base.inicio)} a ${br(vm.base.fim)} (dias fechados de Brasília); projeção a partir de hoje.`}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex gap-2">
          <AlertTriangle aria-hidden="true" size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            É uma estimativa: média diária ponderada pelos dias mais recentes, ajustada pelo dia da semana. Ruptura de estoque não é corrigida
            (dia sem estoque parece dia sem demanda) e promoções ou datas especiais não são previstas.
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar a base da previsão: {error}</div>
        )}
        {avisos.length > 0 && !loading && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
            {`Ficaram fora da contagem por falta de dado: ${avisos.join('; ')}. A base real pode ser maior que a mostrada.`}
          </div>
        )}
        {vm.semBase && !loading && !error && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">Nenhuma unidade vendida com quantidade legível nos últimos 90 dias: não há base para projetar.</div>
        )}
        <PrevisaoKpis kpis={vm.kpis} horizonte={horizonte} loading={loading} />
        <PrevisaoChart dados={vm.grafico} />
        <PrevisaoSkuTable linhas={vm.skus} horizonte={horizonte} loading={loading} />
      </div>
    </div>
  )
}
