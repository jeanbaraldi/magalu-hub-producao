import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Tag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import ChipGroup from '../components/magalu/ChipGroup'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AnunciosResumo from '../components/anuncios/AnunciosResumo'
import SkuCard from '../components/anuncios/SkuCard'
import { useAnunciosData } from '../features/anuncios/useAnunciosData'
import { filtrarSkus } from '../features/anuncios/anuncios.mapper'
import { FILTROS, PAGE_SIZE } from '../features/anuncios/anuncios.constants'

export default function Anuncios() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [limite, setLimite] = useState(PAGE_SIZE)
  const { rows, resumo, loading, error, refetch, isConnected } = useAnunciosData()
  const filtrados = useMemo(() => filtrarSkus(rows, { filtro, busca }), [rows, filtro, busca])
  useEffect(() => { setLimite(PAGE_SIZE) }, [filtro, busca])

  if (!isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Anúncios" />
        <ConecteLoja />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Anúncios"
        subtitle="SKUs do portfólio da loja na Magalu"
        actions={(
          <button type="button" onClick={refetch} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw aria-hidden="true" size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <AnunciosResumo resumo={resumo} loading={loading} />
        <div className="flex flex-wrap items-center gap-3">
          <ChipGroup ariaLabel="Filtro" options={FILTROS} value={filtro} onChange={setFiltro} />
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título ou SKU" />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar anúncios: {error}</div>
        )}
        {!loading && filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState icon={Tag} title="Nenhum SKU encontrado" description={rows.length === 0 ? 'Rode a sincronização em Configurações para trazer o portfólio.' : 'Ajuste o filtro ou a busca.'} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtrados.slice(0, limite).map((s) => <SkuCard key={s.sku} sku={s} />)}
            </div>
            {filtrados.length > limite && (
              <div className="text-center">
                <button type="button" onClick={() => setLimite((l) => l + PAGE_SIZE)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {`Mostrar mais (${filtrados.length - limite} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
