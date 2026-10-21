import { RefreshCw, ShoppingCart, Package, Receipt, Clock } from 'lucide-react'
import { brl, inteiro } from '../magalu/formatos'

const horaMin = (v) => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
}

const pct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}%`

/** Cabeçalho "ao vivo" de Vendas Hoje: receita do dia + 4 tiles, no padrão da Shopee. Só props. */
export default function VendasAoVivoHero({ kpis, loading, sincronizando, sincronizadoEm, erroSync, onAtualizar }) {
  const ultima = horaMin(kpis.ultimaVenda)
  const delta = kpis.variacao.receita
  const avisos = [
    kpis.semValor > 0 && `${kpis.semValor} pedido(s) sem valor legível fora da soma`,
    kpis.cancelados > 0 && `${kpis.cancelados} cancelado(s) hoje, fora da conta`,
    kpis.semQtd > 0 && `${kpis.semQtd} item(ns) sem quantidade legível`,
  ].filter(Boolean)
  const tiles = [
    { icon: ShoppingCart, label: 'Pedidos', valor: inteiro(kpis.pedidos) },
    { icon: Package, label: 'Unidades', valor: inteiro(kpis.unidades) },
    { icon: Receipt, label: 'Ticket médio', valor: brl(kpis.ticket) },
    { icon: Clock, label: 'Última venda', valor: ultima ?? '—' },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-mg-blue to-mg-blue-dark text-white p-6 shadow-card">
      <div aria-hidden="true" className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">Vendas ao vivo · hoje</span>
          </div>
          <p className="text-4xl font-bold tabular-nums leading-tight">{loading ? '—' : brl(kpis.receita)}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-white/90">
            {delta == null ? (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-white/20">sem base ontem até este horário</span>
            ) : (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${delta >= 0 ? 'bg-white/20' : 'bg-black/20'}`}>
                {`${pct(delta)} vs ontem até agora`}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{ultima ? `última venda ${ultima}` : 'sem vendas ainda'}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAtualizar}
          disabled={sincronizando}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors disabled:opacity-60 backdrop-blur-sm"
        >
          <RefreshCw aria-hidden="true" size={14} className={sincronizando ? 'animate-spin' : ''} />
          {sincronizando ? 'Buscando na Magalu…' : 'Atualizar'}
        </button>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
            <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
              <t.icon aria-hidden="true" size={13} /> {t.label}
            </div>
            <p className="text-xl font-bold tabular-nums">{loading ? '—' : t.valor}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 text-[11px] text-white/75 space-y-0.5">
        {avisos.length > 0 && <p>{avisos.join(' · ')}</p>}
        <p>
          {sincronizadoEm
            ? `Pedidos buscados na Magalu às ${horaMin(sincronizadoEm)} · nova busca a cada 2 min com a tela aberta`
            : sincronizando ? 'Buscando pedidos novos na Magalu…' : 'Mostrando o espelho sincronizado da Magalu'}
        </p>
        {erroSync && <p className="text-amber-200">{`Não consegui buscar pedidos novos agora: ${erroSync}. Mostrando o último espelho.`}</p>}
      </div>
    </div>
  )
}
