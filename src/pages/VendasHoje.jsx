import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import VendasAoVivoHero from '../components/vendas/VendasAoVivoHero'
import VendasPorHoraChart from '../components/vendas/VendasPorHoraChart'
import PedidosRecentes from '../components/vendas/PedidosRecentes'
import RankingProdutosHoje from '../components/vendas/RankingProdutosHoje'
import { useVendasHojeData } from '../features/vendas/useVendasHojeData'

export default function VendasHoje() {
  const { vm, atualizadoEm, loading, error, sincronizando, sincronizadoEm, erroSync, refetch, isConnected } = useVendasHojeData()

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
      <PageHeader title="Vendas Hoje" subtitle="Hoje (Brasília) comparado com ontem até a mesma hora" />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar as vendas de hoje: {error}</div>
        )}
        <VendasAoVivoHero
          kpis={vm.kpis}
          loading={loading && !atualizadoEm}
          sincronizando={sincronizando}
          sincronizadoEm={sincronizadoEm}
          erroSync={erroSync}
          onAtualizar={refetch}
        />
        <VendasPorHoraChart horas={vm.horas} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PedidosRecentes pedidos={vm.recentes} total={vm.totalHoje} loading={loading && !atualizadoEm} />
          <RankingProdutosHoje linhas={vm.ranking} semSku={vm.rankingSemSku} loading={loading && !atualizadoEm} />
        </div>
      </div>
    </div>
  )
}
