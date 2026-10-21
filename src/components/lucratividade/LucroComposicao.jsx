import { brl } from '../magalu/formatos'
import { pct, corMargem } from '../performance/percentual'

export default function LucroComposicao({ composicao }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Curva por lucro</h2>
      <p className="text-xs text-slate-400 mb-4">Quem deixa mais dinheiro. A até 80% do lucro, B até 95%.</p>
      <div className="space-y-3">
        {composicao.map((c) => (
          <div key={c.curva} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{`Lucro ${c.curva}`}</p>
              <p className="text-xs text-slate-400">{`${c.skus} SKU(s) · receita ${brl(c.skus ? c.receita : null)}`}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-slate-900">{brl(c.lucro)}</p>
              <p className={`text-xs tabular-nums ${corMargem(c.margem)}`}>{`margem ${pct(c.margem)}`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
