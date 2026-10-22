import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, Camera, CheckCircle, Clock, ExternalLink, GitBranch, Hash, Image, Package,
  ShoppingBag, Tag, Truck, Video, XCircle, Zap,
} from 'lucide-react'
import MargemUnitaria from './MargemUnitaria'
import { brl, inteiro } from '../magalu/formatos'
import { formatRelativeDate } from '../../lib/utils'
import { ESTOQUE_BAIXO } from '../../features/anuncios/anuncios.constants'

// Pílula de status no formato do Gestor ML (ícone + cor por tom).
const TOM = {
  emerald: { cls: 'text-emerald-600 bg-emerald-50', Icone: CheckCircle },
  amber: { cls: 'text-amber-600 bg-amber-50', Icone: Clock },
  rose: { cls: 'text-red-600 bg-red-50', Icone: XCircle },
  blue: { cls: 'text-blue-600 bg-blue-50', Icone: Clock },
  slate: { cls: 'text-slate-600 bg-slate-50', Icone: Tag },
}

const pilula = 'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium'

function corEstoque(e) {
  if (e == null) return 'text-slate-400'
  if (e === 0) return 'text-red-500'
  if (e <= ESTOQUE_BAIXO) return 'text-amber-600'
  return 'text-slate-700'
}

/** Card de um SKU, com a mesma estrutura do card de anúncio do Gestor ML. Só props. */
export default function AnuncioCard({ anuncio: a }) {
  const [copiado, setCopiado] = useState(false)
  const tom = TOM[a.statusInfo?.tone] ?? TOM.slate
  const StatusIcone = tom.Icone
  const pausadoVendendo = !a.ativo && (a.vendidos30 ?? 0) > 0

  return (
    <div className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${pausadoVendendo ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200 hover:border-slate-300'}`}>
      {/* Cabeçalho: foto + título */}
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {a.imagem
            ? <img src={a.imagem} alt={a.titulo ?? ''} loading="lazy" className="w-full h-full object-contain" />
            : <Tag aria-hidden="true" size={20} className="text-slate-300" />}
          {a.fotos > 0 && (
            <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 px-1 py-0.5 bg-black/60 text-white text-[9px] font-medium rounded">
              <Camera aria-hidden="true" size={7} />{a.fotos}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">{a.titulo ?? 'Sem título'}</p>
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="text-xs font-mono text-slate-400 hover:text-slate-600 transition-colors cursor-copy truncate"
              title="Clique para copiar"
              onClick={() => { navigator.clipboard?.writeText(a.sku); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
            >
              {copiado ? 'Copiado!' : a.sku}
            </button>
            {a.marca && <span className="text-[11px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded flex-shrink-0">{a.marca}</span>}
          </div>
        </div>
      </div>

      {/* Pílulas */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className={`${pilula} ${tom.cls}`}><StatusIcone aria-hidden="true" size={10} />{a.statusInfo?.label}</span>
        {a.full === true && <span className={`${pilula} text-blue-600 bg-blue-50`}><Truck aria-hidden="true" size={9} />Full</span>}
        {(a.vendidos30 ?? 0) > 0 && (
          <span className={`${pilula} text-violet-600 bg-violet-50`}>
            <ShoppingBag aria-hidden="true" size={9} />{`${inteiro(a.vendidos30)} vendido${a.vendidos30 !== 1 ? 's' : ''} (30d)`}
          </span>
        )}
        {a.descontoPct != null && <span className={`${pilula} text-rose-600 bg-rose-50`}><Zap aria-hidden="true" size={9} />{`Promo: ${brl(a.preco)}`}</span>}
        {a.tamanhoFamilia > 1 && <span className={`${pilula} text-indigo-600 bg-indigo-50`}><GitBranch aria-hidden="true" size={9} />Família</span>}
        {a.videos > 0 && <span className={`${pilula} text-pink-600 bg-pink-50`}><Video aria-hidden="true" size={9} />Vídeo</span>}
      </div>

      {pausadoVendendo && (
        <div className="flex items-center gap-2 mt-3 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle aria-hidden="true" size={13} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">{`${inteiro(a.vendidos30)} venda(s) nos últimos 30 dias — considere reativar`}</span>
        </div>
      )}

      {/* Preço · vendidos · estoque */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-50">
        <div>
          <p className={`text-base font-bold tabular-nums ${a.descontoPct != null ? 'text-rose-600' : 'text-slate-900'}`}>{brl(a.preco)}</p>
          {a.descontoPct != null && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 line-through">{brl(a.precoLista)}</span>
              <span className="text-[11px] font-semibold text-rose-500">{`-${a.descontoPct.toFixed(0)}%`}</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-700 tabular-nums">{inteiro(a.vendidos30)}</p>
          <p className="text-[11px] text-slate-400">vendidos (30d)</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold tabular-nums ${corEstoque(a.estoque)}`}>{a.estoque == null ? '—' : inteiro(a.estoque)}</p>
          <p className="text-[11px] text-slate-400">{a.estoque == null ? 'estoque não informado' : 'em estoque'}</p>
        </div>
      </div>

      <MargemUnitaria margem={a.margem} />

      {/* Indicadores de qualidade */}
      {(a.fotos != null || a.videos != null) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[11px] text-slate-400">
          {a.fotos != null && <span className="flex items-center gap-0.5" title="Fotos"><Image aria-hidden="true" size={9} />{` ${a.fotos} foto${a.fotos !== 1 ? 's' : ''}`}</span>}
          {a.videos > 0 && <span className="flex items-center gap-0.5" title="Vídeos"><Video aria-hidden="true" size={9} />{` ${a.videos}`}</span>}
          {a.tamanhoFamilia > 1 && <span className="flex items-center gap-0.5" title="Variações"><Hash aria-hidden="true" size={9} />{` ${a.tamanhoFamilia} variações`}</span>}
        </div>
      )}

      {/* Rodapé: link, custo e data */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-50">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer" title="Ver na Magalu" aria-label="Ver na Magalu"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          )}
          {a.margem?.bloqueado ? null : a.temCusto ? (
            <Link to="/produtos" title="Custo cadastrado em Produtos"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-300 rounded-lg transition-colors">
              <Package aria-hidden="true" size={11} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-700">{`Custo ${brl(a.custo)}`}</span>
            </Link>
          ) : (
            <Link to="/produtos"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors">
              <Hash aria-hidden="true" size={11} />Cadastrar custo
            </Link>
          )}
        </div>
        <div className="text-[11px] text-slate-400 text-right">
          {a.sincronizadoEm && <span title={new Date(a.sincronizadoEm).toLocaleString('pt-BR')}>{`Atualizado ${formatRelativeDate(a.sincronizadoEm)}`}</span>}
        </div>
      </div>
    </div>
  )
}
