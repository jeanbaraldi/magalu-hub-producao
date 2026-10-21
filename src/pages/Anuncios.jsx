import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, RefreshCw, Tag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AnunciosResumoFaixa from '../components/anuncios/AnunciosResumoFaixa'
import AnunciosToolbar from '../components/anuncios/AnunciosToolbar'
import AnuncioCard from '../components/anuncios/AnuncioCard'
import FamiliaCard from '../components/anuncios/FamiliaCard'
import { useAnunciosData } from '../features/anuncios/useAnunciosData'
import { agruparFamilias, contarAbas, filtrarSkus, ordenarSkus } from '../features/anuncios/anuncios.mapper'
import { PAGE_SIZE } from '../features/anuncios/anuncios.constants'
import { inteiro } from '../components/magalu/formatos'

export default function Anuncios() {
  const [aba, setAba] = useState('todos')
  const [sub, setSub] = useState('todos')
  const [busca, setBusca] = useState('')
  const [visao, setVisao] = useState('grade')
  const [ordem, setOrdem] = useState('titulo')
  const [limite, setLimite] = useState(PAGE_SIZE)
  const d = useAnunciosData()

  const contagens = useMemo(() => contarAbas(d.rows), [d.rows])
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

  const itens = grupos ? [...grupos.familias.map((f) => ({ familia: f })), ...grupos.soltos.map((a) => ({ anuncio: a }))] : filtrados.map((a) => ({ anuncio: a }))
  const r = d.resultadoSync

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Anúncios"
        subtitle={d.loading ? 'Carregando…' : `${inteiro(d.resumo.total)} SKUs • ${inteiro(d.resumo.semCusto)} sem custo`}
        wrapActions
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/produtos" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Package aria-hidden="true" size={14} /> Custos dos produtos
            </Link>
            <button type="button" onClick={d.refetch} disabled={d.loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw aria-hidden="true" size={14} className={d.loading && !d.sincronizando ? 'animate-spin' : ''} /> Recarregar
            </button>
            <button type="button" onClick={d.sincronizar} disabled={d.sincronizando} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-mg-blue hover:bg-mg-blue-dark text-white text-sm font-semibold disabled:opacity-60">
              <RefreshCw aria-hidden="true" size={14} className={d.sincronizando ? 'animate-spin' : ''} />
              {d.sincronizando ? 'Sincronizando…' : 'Sincronizar com a Magalu'}
            </button>
          </div>
        )}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <AnunciosResumoFaixa resumo={d.resumo} loading={d.loading} />
        {r && (
          <div className={`rounded-xl px-4 py-2.5 text-sm border ${r.ok ? (r.parcial ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : 'bg-red-50 border-red-200 text-red-700'}`}>
            {!r.ok ? `Não consegui sincronizar com a Magalu: ${r.erro}` : r.parcial ? 'Sincronização parcial: o tempo acabou antes de ler todos os SKUs. Rode de novo para completar.' : 'Catálogo sincronizado com a Magalu.'}
          </div>
        )}
        <AnunciosToolbar
          aba={aba} onAba={setAba} contagens={contagens}
          sub={sub} onSub={setSub}
          busca={busca} onBusca={setBusca}
          visao={visao} onVisao={setVisao}
          ordem={ordem} onOrdem={setOrdem}
        />
        {d.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar anúncios: {d.error}</div>
        )}
        {!d.loading && itens.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState icon={Tag} title="Nenhum anúncio encontrado" description={d.rows.length === 0 ? 'Clique em "Sincronizar com a Magalu" para trazer o portfólio.' : 'Ajuste a aba, o filtro ou a busca.'} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {itens.slice(0, limite).map((i) => (i.familia
                ? <FamiliaCard key={`f-${i.familia.id}`} familia={i.familia} />
                : <AnuncioCard key={i.anuncio.sku} anuncio={i.anuncio} />))}
            </div>
            {itens.length > limite && (
              <div className="text-center">
                <button type="button" onClick={() => setLimite((l) => l + PAGE_SIZE)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {`Mostrar mais (${itens.length - limite} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
