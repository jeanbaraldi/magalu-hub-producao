import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutList, Stethoscope, Wallet } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import CatalogoAcoes from '../components/catalogo/CatalogoAcoes'
import CatalogoAvisos from '../components/catalogo/CatalogoAvisos'
import CatalogoKpis from '../components/catalogo/CatalogoKpis'
import CatalogoList from '../components/catalogo/CatalogoList'
import DiagnosticoPanel from '../components/catalogo/diagnostico/DiagnosticoPanel'
import CustosAba from './produtos/CustosAba'
import { useCatalogoData } from '../features/catalogo/useCatalogoData'
import { contarAbas, filtrarCatalogo, ordenarCatalogo, totaisCatalogo } from '../features/catalogo/catalogo.mapper'

const ABAS = [
  { key: 'catalogo', label: 'Catálogo', icon: LayoutList },
  { key: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope },
  { key: 'custos', label: 'Custos', icon: Wallet },
]

export default function Produtos() {
  const d = useCatalogoData()
  const [params, setParams] = useSearchParams()
  const aba = ABAS.some((a) => a.key === params.get('aba')) ? params.get('aba') : 'catalogo'
  const [filtro, setFiltro] = useState('todos')
  const [ordem, setOrdem] = useState('receita')
  const [busca, setBusca] = useState('')

  const counts = useMemo(() => contarAbas(d.rows), [d.rows])
  const filtrados = useMemo(() => ordenarCatalogo(filtrarCatalogo(d.rows, { aba: filtro, busca }), ordem), [d.rows, filtro, busca, ordem])
  const totais = useMemo(() => totaisCatalogo(filtrados), [filtrados])

  const trocarAba = (key) => {
    // Custos editados na aba Custos valem para o Catálogo e o Diagnóstico ao voltar.
    if (aba === 'custos' && key !== 'custos') d.refetch()
    setParams(key === 'catalogo' ? {} : { aba: key }, { replace: true })
  }

  if (!d.isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Produtos" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Produtos"
        subtitle="Receita, contribuição e margem por SKU nos últimos 30 dias"
        actions={<CatalogoAcoes podeVerValores={d.podeVerValores} puxandoCustos={d.puxandoCustos} sincronizando={d.sincronizando} onPuxarCustos={d.puxarCustos} onSincronizar={d.sincronizar} />}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-6">
        <div className="flex items-center gap-1 border-b border-slate-200" role="tablist" aria-label="Seções de produtos">
          {ABAS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="tab" aria-selected={aba === key} onClick={() => trocarAba(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${aba === key ? 'border-mg-blue text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {aba !== 'custos' && <CatalogoAvisos error={d.error} avisoVendas={d.avisoVendas} aviso={d.aviso} />}

        {aba === 'catalogo' && (
          <>
            {!d.loading && d.rows.length > 0 && <CatalogoKpis totais={totais} podeVerValores={d.podeVerValores} />}
            <CatalogoList rows={filtrados} counts={counts} aba={filtro} onAba={setFiltro} ordem={ordem} onOrdem={setOrdem}
              busca={busca} onBusca={setBusca} loading={d.loading} error={null} podeVerValores={d.podeVerValores} />
          </>
        )}

        {aba === 'diagnostico' && (
          <DiagnosticoPanel rows={d.diagnostico} loading={d.loading} error={null} desde={d.desde}
            podeVerValores={d.podeVerValores} onRefresh={d.refetch} />
        )}

        {aba === 'custos' && <CustosAba />}
      </div>
    </div>
  )
}
