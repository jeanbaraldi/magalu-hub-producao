import { Plus, Store } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LojaRow from '../components/configuracoes/LojaRow'
import ResultadoSync from '../components/configuracoes/ResultadoSync'
import { useApp } from '../context/AppContext'
import { useSincronizacao } from '../features/configuracoes/useSincronizacao'

export default function Settings() {
  const { sellers, contaId, selectSeller, addAccount, removeAccount, isConnecting, connectionError, checkingStatus } = useApp()
  const { sincronizar, rodando, resultado } = useSincronizacao()

  function desconectar(loja) {
    const nome = loja.nickname ?? loja.id
    if (window.confirm(`Desconectar a loja ${nome}? Os dados já sincronizados ficam no banco.`)) removeAccount(loja.id ?? loja.account_id)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Configurações"
        subtitle="Lojas da Magalu conectadas a este painel"
        actions={(
          <button type="button" onClick={addAccount} disabled={isConnecting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mg-blue text-white text-sm font-bold hover:bg-mg-blue-dark disabled:opacity-50">
            <Plus aria-hidden="true" size={15} /> {isConnecting ? 'Conectando…' : 'Conectar loja'}
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl">
        {connectionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{connectionError}</div>
        )}
        <ResultadoSync resultado={resultado} />
        <section className="bg-white rounded-xl border border-slate-200">
          <h2 className="px-4 pt-4 pb-2 text-sm font-bold text-slate-900">Lojas conectadas</h2>
          {checkingStatus ? (
            <p className="px-4 pb-4 text-sm text-slate-400">Carregando lojas…</p>
          ) : sellers.length === 0 ? (
            <EmptyState icon={Store} title="Nenhuma loja conectada" description="Clique em Conectar loja e autorize no ID Magalu. Uma loja nova só aparece para a equipe depois que o admin a ativar no Hub." />
          ) : (
            <div className="divide-y divide-slate-100">
              {sellers.map((s) => {
                const id = String(s.id ?? s.account_id)
                return (
                  <LojaRow
                    key={id}
                    loja={s}
                    ativa={id === contaId}
                    sincronizando={rodando === id}
                    onSincronizar={(conta) => sincronizar(conta)}
                    onDesconectar={desconectar}
                    onSelecionar={selectSeller}
                  />
                )
              })}
            </div>
          )}
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600 space-y-1.5">
          <h2 className="text-sm font-bold text-slate-900">Como os dados chegam</h2>
          <p>Pedidos sincronizam sozinhos a cada 30 minutos (últimos 3 dias) e o portfólio de SKUs uma vez por dia.</p>
          <p>O botão Sincronizar agora lê os últimos 30 dias de pedidos e o portfólio inteiro da loja.</p>
          <p>O Client ID e o Client Secret do app Magalu ficam no Hub, em Conexões.</p>
        </section>
      </div>
    </div>
  )
}
