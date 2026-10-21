import { RefreshCw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import VendasHojeKpis from '../components/vendas/VendasHojeKpis'
import VendasPorHoraChart from '../components/vendas/VendasPorHoraChart'
import PedidosRecentes from '../components/vendas/PedidosRecentes'
import RankingProdutosHoje from '../components/vendas/RankingProdutosHoje'
import { useVendasHojeData } from '../features/vendas/useVendasHojeData'

const horaMin = (d) => (d ? d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : '—')

export default function VendasHoje() {
  const { vm, atualizadoEm, loading, error, refetch, isConnected } = useVendasHojeData()

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Vendas Hoje" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vendas Hoje"
        subtitle={`Hoje (Brasília) comparado com ontem até a mesma hora · atualiza a cada 60 s · última leitura ${horaMin(atualizadoEm)}`}
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar as vendas de hoje: {error}</div>
        )}
        <VendasHojeKpis kpis={vm.kpis} loading={loading && !atualizadoEm} />
        <VendasPorHoraChart horas={vm.horas} horaAgora={vm.horaAgora} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PedidosRecentes pedidos={vm.recentes} total={vm.totalHoje} loading={loading && !atualizadoEm} />
          <RankingProdutosHoje linhas={vm.ranking} semSku={vm.rankingSemSku} loading={loading && !atualizadoEm} />
        </div>
        <p className="text-xs text-slate-400">Os números vêm do espelho sincronizado da Magalu; pedidos feitos depois da última sincronização ainda não aparecem.</p>
      </div>
    </div>
  )
}
