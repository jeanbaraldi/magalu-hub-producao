import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import ImpostosForm from '../components/impostos/ImpostosForm'
import { useImpostosData } from '../features/impostos/useImpostosData'
import { MSG_SEM_ACESSO } from '../features/impostos/impostos.constants'

export default function Impostos() {
  const d = useImpostosData()

  if (!d.isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Impostos e comissão" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Impostos e comissão" subtitle="Regime, alíquota, comissão da Magalu e frete usados no cálculo de margem" />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          Configuração da loja <strong>{d.lojaNome ?? '—'}</strong>. Cada loja tem a sua.
        </div>
        {d.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar a configuração: {d.error}</div>
        )}
        {d.loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">Carregando configuração…</div>
        ) : !d.podeVerValores ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">{MSG_SEM_ACESSO}</div>
        ) : !d.error && (
          <ImpostosForm key={d.contaId} cfg={d.cfg} onSalvar={d.salvarConfig} />
        )}
      </div>
    </div>
  )
}
