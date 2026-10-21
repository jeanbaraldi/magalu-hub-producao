import { Link } from 'react-router-dom'
import { Camera, ExternalLink, ImageOff, Hash, Package, Video } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import MargemUnitaria from './MargemUnitaria'
import { brl, inteiro } from '../magalu/formatos'
import { formatRelativeDate } from '../../lib/utils'
import { ESTOQUE_BAIXO } from '../../features/anuncios/anuncios.constants'

function corEstoque(e) {
  if (e == null) return 'text-slate-400'
  if (e === 0) return 'text-rose-600'
  if (e <= ESTOQUE_BAIXO) return 'text-amber-600'
  return 'text-slate-900'
}

/** Card de um SKU no formato do Gestor ML: preço, vendas 30d, estoque e margem. Só props. */
export default function AnuncioCard({ anuncio: a }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="relative w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {a.imagem
            ? <img src={a.imagem} alt="" loading="lazy" className="w-full h-full object-contain" />
            : <ImageOff aria-hidden="true" size={18} className="text-slate-300" />}
          {a.fotos != null && (
            <span className="absolute bottom-0.5 right-0.5 inline-flex items-center gap-0.5 rounded bg-white/90 px-1 text-[10px] font-semibold text-slate-600" title={`${a.fotos} foto(s)`}>
              <Camera aria-hidden="true" size={9} />{a.fotos}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{a.titulo ?? 'Sem título'}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] text-slate-400 font-mono truncate">{a.sku}</span>
            {a.marca && <span className="text-[11px] text-slate-500 bg-slate-100 rounded px-1.5">{a.marca}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge {...a.statusInfo} />
        {a.full === true && <StatusBadge label="Full" tone="emerald" />}
        {(a.vendidos30 ?? 0) > 0 && <StatusBadge label={`${inteiro(a.vendidos30)} vendido(s) em 30d`} tone="blue" />}
        {a.descontoPct != null && <StatusBadge label={`Promo: ${brl(a.preco)}`} tone="rose" />}
        {a.tamanhoFamilia > 1 && <StatusBadge label={`Família · ${a.tamanhoFamilia} variações`} tone="violet" />}
        {a.videos > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Video aria-hidden="true" size={11} />vídeo</span>
        )}
      </div>

      <div className="grid grid-cols-3 items-end gap-2">
        <div>
          <p className={`text-lg font-bold tabular-nums leading-tight ${a.descontoPct != null ? 'text-rose-600' : 'text-slate-900'}`}>{brl(a.preco)}</p>
          {a.descontoPct != null && (
            <p className="text-[11px] tabular-nums"><span className="text-slate-400 line-through">{brl(a.precoLista)}</span> <span className="text-rose-600">{`-${a.descontoPct.toFixed(0)}%`}</span></p>
          )}
        </div>
        <div className="text-center">
          <p className="text-base font-bold tabular-nums text-slate-900">{inteiro(a.vendidos30)}</p>
          <p className="text-[11px] text-slate-400">vendidos (30d)</p>
        </div>
        <div className="text-right">
          <p className={`text-base font-bold tabular-nums ${corEstoque(a.estoque)}`}>{a.estoque == null ? '—' : inteiro(a.estoque)}</p>
          <p className="text-[11px] text-slate-400">{a.estoque == null ? 'estoque não informado' : 'em estoque'}</p>
        </div>
      </div>

      <MargemUnitaria margem={a.margem} />

      <div className="mt-auto flex items-center gap-2 pt-1">
        {a.url && (
          <a href={a.url} target="_blank" rel="noreferrer" title="Ver na Magalu" aria-label="Ver na Magalu" className="p-1.5 rounded-lg text-slate-400 hover:text-mg-blue hover:bg-slate-50">
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        )}
        {a.margem?.bloqueado ? null : a.temCusto ? (
          <Link to="/produtos" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100" title="Custo cadastrado em Produtos">
            <Package aria-hidden="true" size={13} />{`Custo ${brl(a.custo)}`}
          </Link>
        ) : (
          <Link to="/produtos" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-mg-blue/30 text-mg-blue text-xs font-semibold hover:bg-blue-50">
            <Hash aria-hidden="true" size={13} />Cadastrar custo
          </Link>
        )}
        <span className="ml-auto text-[11px] text-slate-400">{a.sincronizadoEm ? `Atualizado ${formatRelativeDate(a.sincronizadoEm)}` : ''}</span>
      </div>
    </div>
  )
}
