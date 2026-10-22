import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, GitBranch, Package, RefreshCw, Search, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AnunciosResumoFaixa from '../components/anuncios/AnunciosResumoFaixa'
import AnunciosToolbar from '../components/anuncios/AnunciosToolbar'
import AnuncioCard from '../components/anuncios/AnuncioCard'
import FamiliaCard from '../components/anuncios/FamiliaCard'
import { useAnunciosData } from '../features/anuncios/useAnunciosData'
import { agruparFamilias, contarAbas, contarSubfiltros, filtrarSkus, ordenarSkus } from '../features/anuncios/anuncios.mapper'
import { PAGE_SIZE } from '../features/anuncios/anuncios.constants'
import { inteiro } from '../components/magalu/formatos'

const GRADE = 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3'

export default function Anuncios() {
  const [aba, setAba] = useState('todos')
  const [sub, setSub] = useState('todos')
  const [busca, setBusca] = useState('')
  const [visao, setVisao] = useState('grade')
  const [ordem, setOrdem] = useState('titulo')
  const [limite, setLimite] = useState(PAGE_SIZE)
  const d = useAnunciosData()

  const contagens = useMemo(() => contarAbas(d.rows), [d.rows])
  const contagensSub = useMemo(() => contarSubfiltros(d.rows), [d.rows])
  const filtrados = useMemo(
    () => ordenarSkus(filtrarSkus(d.rows, { aba, sub: aba === 'ativos' ? sub : 'todos', busca }), ordem),
    [d.rows, aba, sub, busca, ordem],
  )
  const grupos = useMemo(() => (visao === 'familias' ? agruparFamilias(filtrados) : null), [visao, filtrados])
  useEffect(() => { setLimite(PAGE_SIZE) }, [aba, sub, busca, ordem, visao])

  if (!d.isConnected) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Anúncios" />
        <ConecteLoja />
      </div>
    )
  }

  const soltos = grupos ? grupos.soltos : filtrados
  const restantes = soltos.length - limite
  const r = d.resultadoSync
  const cards = (lista) => (
    <div className={GRADE}>
      {lista.slice(0, limite).map((a) => <AnuncioCard key={a.sku} anuncio={a} />)}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Anúncios"
        subtitle={d.loading ? 'Carregando…' : `${inteiro(d.resumo.total)} SKUs • ${inteiro(d.resumo.semCusto)} sem custo`}
        wrapActions
        actions={(
          <div className="flex items-center flex-wrap gap-2">
            <Link to="/produtos" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
              <Package aria-hidden="true" size={14} />Custos dos produtos
            </Link>
            <button type="button" onClick={d.refetch} disabled={d.loading} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
              <RefreshCw aria-hidden="true" size={14} className={d.loading && !d.sincronizando ? 'animate-spin' : ''} />Recarregar
            </button>
            <button type="button" onClick={d.sincronizar} disabled={d.sincronizando} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-mg-blue hover:bg-mg-blue-dark rounded-xl transition-colors disabled:opacity-60">
              <RefreshCw aria-hidden="true" size={14} className={d.sincronizando ? 'animate-spin' : ''} />
              {d.sincronizando ? 'Sincronizando…' : 'Sincronizar com a Magalu'}
            </button>
          </div>
        )}
      />
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        {r && (
          <div className={`mb-4 rounded-xl px-4 py-2.5 text-sm border ${r.ok ? (r.parcial ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : 'bg-red-50 border-red-200 text-red-700'}`}>
            {!r.ok ? `Não consegui sincronizar com a Magalu: ${r.erro}` : r.parcial ? 'Sincronização parcial: o tempo acabou antes de ler todos os SKUs. Rode de novo para completar.' : 'Catálogo sincronizado com a Magalu.'}
          </div>
        )}

        {!d.loading && d.rows.length > 0 && <AnunciosResumoFaixa resumo={d.resumo} />}

        <AnunciosToolbar
          aba={aba} onAba={setAba} contagens={contagens} contagensSub={contagensSub}
          sub={sub} onSub={setSub}
          busca={busca} onBusca={setBusca}
          visao={visao} onVisao={setVisao}
          ordem={ordem} onOrdem={setOrdem}
        />

        {d.error && (
          <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle aria-hidden="true" size={16} />{`Erro ao carregar anúncios: ${d.error}`}
          </div>
        )}

        {d.loading && (
          <div className={GRADE}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="animate-pulse flex gap-3">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    <div className="flex gap-1.5 mt-2">
                      <div className="h-5 w-14 bg-slate-100 rounded-md" />
                      <div className="h-5 w-16 bg-slate-100 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!d.loading && d.rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Tag aria-hidden="true" size={28} className="text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-700 mb-1">Nenhum anúncio encontrado</p>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Sincronize seu portfólio da Magalu para começar a gerenciar sua loja</p>
            <button type="button" onClick={d.sincronizar} disabled={d.sincronizando} className="inline-flex items-center gap-2 px-6 py-3 bg-mg-blue hover:bg-mg-blue-dark text-white font-bold text-sm rounded-xl transition-colors">
              <RefreshCw aria-hidden="true" size={14} className={d.sincronizando ? 'animate-spin' : ''} />Sincronizar agora
            </button>
          </div>
        )}

        {!d.loading && d.rows.length > 0 && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search aria-hidden="true" size={24} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">{busca ? `Nenhum resultado para "${busca}"` : 'Nenhum anúncio neste filtro'}</p>
            <p className="text-xs text-slate-400 mt-1">Tente buscar por título, SKU ou marca</p>
          </div>
        )}

        {!d.loading && filtrados.length > 0 && !grupos && cards(filtrados)}

        {!d.loading && grupos && (grupos.familias.length > 0 || grupos.soltos.length > 0) && (
          <div className="space-y-4">
            {grupos.familias.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GitBranch aria-hidden="true" size={12} />{`Famílias (${grupos.familias.length})`}
                </h3>
                <div className={GRADE}>
                  {grupos.familias.map((f) => <FamiliaCard key={f.id} familia={f} />)}
                </div>
              </div>
            )}
            {grupos.soltos.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{`Independentes (${grupos.soltos.length})`}</h3>
                {cards(grupos.soltos)}
              </div>
            )}
          </div>
        )}

        {!d.loading && restantes > 0 && (
          <div className="flex justify-center mt-4">
            <button type="button" onClick={() => setLimite((l) => l + PAGE_SIZE)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
              {`Carregar mais (${restantes} restantes)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
