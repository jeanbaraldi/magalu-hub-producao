import { pct } from '../performance/percentual'
import { CURVA_CORES } from '../../features/analiseAbc/analiseAbc.constants'
import { fmtMetrica } from './fmt'

/** Três cartões A/B/C: quantos SKUs e quanto da métrica cada curva concentra. */
export default function AbcComposicao({ composicao, resumo, metrica, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {composicao.map((c) => (
        <div key={c.curva} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: CURVA_CORES[c.curva] }} />
            <p className="text-sm font-bold text-slate-900">{`Curva ${c.curva}`}</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2">{loading ? '…' : pct(c.pctValor)}</p>
          <p className="text-xs text-slate-500 mt-1">{`${metrica === 'unidades' ? 'das unidades' : 'da receita'} · ${fmtMetrica(c.skus > 0 ? c.valor : null, metrica)}`}</p>
          <p className="text-xs text-slate-400 mt-1">{`${c.skus} SKU(s) · ${pct(c.pctSkus, 0)} do mix`}</p>
        </div>
      ))}
      {!loading && (resumo.foraDaCurva > 0 || resumo.parciais > 0 || resumo.semSku > 0) && (
        <p className="sm:col-span-3 text-xs text-amber-700">
          {[
            resumo.foraDaCurva > 0 && `${resumo.foraDaCurva} SKU(s) sem valor conhecido ficaram fora da curva`,
            resumo.parciais > 0 && `${resumo.parciais} SKU(s) com dado parcial (item sem ${metrica === 'unidades' ? 'quantidade' : 'valor'} legível)`,
            resumo.semSku > 0 && `${resumo.semSku} item(ns) vendido(s) sem SKU`,
          ].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  )
}
