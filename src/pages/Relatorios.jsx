import { RefreshCw, Printer } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import RelatorioKpis from '../components/relatorios/RelatorioKpis'
import ReceitaComparadaChart from '../components/relatorios/ReceitaComparadaChart'
import ReceitaDiaSemanaChart from '../components/relatorios/ReceitaDiaSemanaChart'
import TopSkusTable from '../components/relatorios/TopSkusTable'
import { useRelatoriosData } from '../features/relatorios/useRelatoriosData'
import { PERIOD_OPTIONS } from '../features/relatorios/relatorios.constants'

const br = (dia) => (dia ? `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}` : '—')

export default function Relatorios() {
  const { vm, dias, setDias, vazio, loading, error, refetch, isConnected } = useRelatoriosData()

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Relatórios" />
        <ConecteLoja />
      </div>
    )
  }

  const botao = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50'
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Relatórios"
        subtitle="Período atual comparado ao período anterior de mesmo tamanho"
        actions={(
          <div className="flex items-center gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} disabled={loading} className={botao}>
              <Printer aria-hidden="true" size={14} /> Exportar PDF
            </button>
            <button type="button" onClick={refetch} disabled={loading} className={botao}>
              <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
          </div>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <ChipGroup ariaLabel="Período" options={PERIOD_OPTIONS} value={dias} onChange={setDias} />
        </div>
        <p className="text-xs text-slate-500">
          {`Atual: ${br(vm.periodo.inicio)} a ${br(vm.periodo.fim)} (inclui hoje, ainda em andamento) · Anterior: ${br(vm.periodoAnterior.inicio)} a ${br(vm.periodoAnterior.fim)} (dias fechados). Dias de Brasília; cancelados fora da receita.`}
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar o relatório: {error}</div>
        )}
        {vazio && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">Nenhum pedido sincronizado nos dois períodos. Confira a sincronização em Configurações.</div>
        )}
        <RelatorioKpis kpis={vm.kpis} loading={loading} />
        <ReceitaComparadaChart serie={vm.serie} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <ReceitaDiaSemanaChart dados={vm.porDiaSemana} />
          <TopSkusTable linhas={vm.topSkus} semSku={vm.semSku} loading={loading} />
        </div>
      </div>
    </div>
  )
}
