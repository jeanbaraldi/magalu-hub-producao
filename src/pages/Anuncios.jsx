import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, BarChart3, Box, ChevronDown, Search, ShoppingBag, Tag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import ConecteLoja from '../components/magalu/ConecteLoja'
import AnuncioCard from '../components/catalogo/AnuncioCard'
import CatalogoAcoes from '../components/catalogo/CatalogoAcoes'
import CatalogoAvisos from '../components/catalogo/CatalogoAvisos'
import { useCatalogoData } from '../features/catalogo/useCatalogoData'
import { contarAbas, filtrarCatalogo, ordenarAnuncios, resumoAnuncios } from '../features/catalogo/catalogo.mapper'
import { ABAS_ANUNCIOS, CARDS_POR_PAGINA, ORDENS_ANUNCIOS } from '../features/catalogo/catalogo.constants'
import { formatCompact, formatCurrency, formatNumber } from '../lib/utils'

export default function Anuncios() {
  const d = useCatalogoData()
  const [aba, setAba] = useState('todos')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('vendidos')
  const [menuOrdem, setMenuOrdem] = useState(false)
  const [limite, setLimite] = useState(CARDS_POR_PAGINA)
  useEffect(() => { setLimite(CARDS_POR_PAGINA) }, [aba, busca, ordem])

  const abas = d.podeVerValores ? ABAS_ANUNCIOS : ABAS_ANUNCIOS.filter((a) => a.key !== 'com_custo' && a.key !== 'sem_custo')
  const counts = useMemo(() => contarAbas(d.rows), [d.rows])
  const filtrados = useMemo(() => ordenarAnuncios(filtrarCatalogo(d.rows, { aba, busca }), ordem), [d.rows, aba, busca, ordem])
  const resumo = useMemo(() => resumoAnuncios(filtrados), [filtrados])

  if (!d.isConnected) {
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
        subtitle="SKUs do portfólio da loja na Magalu, com preço, estoque e margem por unidade"
        actions={<CatalogoAcoes podeVerValores={d.podeVerValores} puxandoCustos={d.puxandoCustos} sincronizando={d.sincronizando} onPuxarCustos={d.puxarCustos} onSincronizar={d.sincronizar} />}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-4">
        <CatalogoAvisos error={d.error} avisoVendas={d.avisoVendas} aviso={d.aviso} />

        {!d.loading && d.rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Tag size={12} />
              <span className="font-semibold text-slate-700">{formatNumber(resumo.total)}</span> anúncios
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Box size={12} />
              <span className="font-semibold text-slate-700">{formatCompact(resumo.estoque)}</span> em estoque
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <BarChart3 size={12} />
              Preço médio <span className="font-semibold text-slate-700">{resumo.precoMedio != null ? formatCurrency(resumo.precoMedio) : '—'}</span>
            </div>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShoppingBag size={12} />
              <span className="font-semibold text-slate-700">{formatNumber(resumo.vendidos30)}</span> vendidos (30d)
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 flex-shrink-0 max-w-full overflow-x-auto">
            {abas.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setAba(key)} aria-pressed={aba === key}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aba === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {`${label} (${counts[key]})`}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar anúncios" placeholder="Buscar título ou SKU..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mg-blue focus:border-transparent bg-white" />
          </div>

          <div className="relative">
            <button type="button" onClick={() => setMenuOrdem((v) => !v)} aria-expanded={menuOrdem}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
              <ArrowUpDown size={12} />
              {ORDENS_ANUNCIOS.find((o) => o.key === ordem)?.label}
              <ChevronDown size={10} />
            </button>
            {menuOrdem && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOrdem(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[160px]">
                  {ORDENS_ANUNCIOS.filter((o) => d.podeVerValores || o.key !== 'maior_margem').map((o) => (
                    <button key={o.key} type="button" onClick={() => { setOrdem(o.key); setMenuOrdem(false) }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${ordem === o.key ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {d.loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 animate-fade-in">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="animate-pulse flex gap-3">
                  <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!d.loading && filtrados.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtrados.slice(0, limite).map((r) => <AnuncioCard key={r.sku} row={r} podeVerValores={d.podeVerValores} />)}
            </div>
            {filtrados.length > limite && (
              <div className="text-center">
                <button type="button" onClick={() => setLimite((l) => l + CARDS_POR_PAGINA)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl shadow-sm border border-slate-200">
                  {`Mostrar mais (${filtrados.length - limite} restantes)`}
                </button>
              </div>
            )}
          </>
        )}

        {!d.loading && filtrados.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12">
            {d.rows.length === 0 ? 'Nenhum SKU sincronizado. Clique em "Sincronizar com a Magalu" para trazer o portfólio.' : busca ? `Nenhum anúncio encontrado para "${busca}".` : 'Nenhum anúncio com o filtro selecionado.'}
          </p>
        )}
      </div>
    </div>
  )
}
