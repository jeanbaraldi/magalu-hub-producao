import VariacaoBadge from './VariacaoBadge'

/** Cartão de KPI com valor atual, valor de comparação e variação %. Só props. */
export default function KpiComparado({ titulo, valor, comparado, variacao, piorQuandoSobe, legenda, aviso, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 font-medium truncate">{titulo}</p>
      <p className="text-xl font-bold mt-1 leading-none tabular-nums text-slate-900">{loading ? '…' : valor}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {!loading && <VariacaoBadge valor={variacao} piorQuandoSobe={piorQuandoSobe} />}
        {!loading && comparado != null && <span className="text-xs text-slate-400">{`${legenda ?? 'antes'}: ${comparado}`}</span>}
      </div>
      {aviso && !loading && <p className="text-[11px] text-amber-700 mt-1.5">{aviso}</p>}
    </div>
  )
}
