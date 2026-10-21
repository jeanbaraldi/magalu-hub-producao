import { ImageOff } from 'lucide-react'
import StatusBadge from '../magalu/StatusBadge'
import { brl } from '../magalu/formatos'
import { ESTOQUE_BAIXO } from '../../features/anuncios/anuncios.constants'

function corEstoque(e) {
  if (e == null) return 'text-slate-400'
  if (e === 0) return 'text-rose-600'
  if (e <= ESTOQUE_BAIXO) return 'text-amber-600'
  return 'text-slate-900'
}

export default function SkuCard({ sku }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 hover:shadow-md transition-shadow">
      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {sku.imagem
          ? <img src={sku.imagem} alt="" loading="lazy" className="w-full h-full object-contain" />
          : <ImageOff aria-hidden="true" size={18} className="text-slate-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{sku.titulo ?? 'Sem título'}</p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{sku.sku}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <StatusBadge {...sku.statusInfo} />
          {sku.descontoPct != null && <StatusBadge label={`−${sku.descontoPct.toFixed(0)}%`} tone="rose" />}
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            {sku.descontoPct != null && <p className="text-[11px] text-slate-400 line-through">{brl(sku.precoLista)}</p>}
            <p className="text-base font-bold text-slate-900 tabular-nums">{brl(sku.preco)}</p>
          </div>
          <p className={`text-xs font-semibold tabular-nums ${corEstoque(sku.estoque)}`}>
            {sku.estoque == null ? 'Estoque não informado' : `${sku.estoque} em estoque`}
          </p>
        </div>
      </div>
    </div>
  )
}
