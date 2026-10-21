import { Link } from 'react-router-dom'
import { brl } from '../magalu/formatos'
import { pct, corMargem } from '../performance/percentual'

/** Lucro do período ou "Indisponível" com o que falta + cobertura de custo. */
export default function LucroResumo({ dre, loading }) {
  const { cobertura } = dre
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500">Lucro no período</p>
        {loading ? <p className="text-2xl font-bold mt-1">…</p> : dre.lucro != null ? (
          <>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${dre.lucro < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{brl(dre.lucro)}</p>
            <p className={`text-xs mt-1 ${corMargem(dre.margem)}`}>{`margem ${pct(dre.margem)}${dre.semFrete ? ' · sem frete' : ''}`}</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-400 mt-1">Indisponível</p>
            {dre.faltando.length > 0 && <p className="text-xs text-amber-700 mt-1">{`Falta: ${dre.faltando.join('; ')}`}</p>}
          </>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
        <p className="text-sm text-slate-500">Cobertura de custo</p>
        {loading ? <p className="text-2xl font-bold mt-1">…</p> : cobertura.skusComCusto == null ? (
          <p className="text-sm text-slate-500 mt-2">Seu acesso não inclui custos e margem.</p>
        ) : cobertura.skusVendidos === 0 ? (
          <p className="text-sm text-slate-500 mt-2">Sem SKUs vendidos no período.</p>
        ) : (
          <>
            <p className="text-sm text-slate-800 mt-2">
              {`Custo cadastrado para ${cobertura.skusComCusto} de ${cobertura.skusVendidos} SKUs vendidos, ${pct(cobertura.pctReceita, 0)} da receita.`}
            </p>
            <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, cobertura.pctReceita ?? 0)}%` }} />
            </div>
            {cobertura.skusComCusto < cobertura.skusVendidos && (
              <Link to="/produtos" className="inline-block text-xs font-semibold text-mg-blue underline mt-2">Cadastrar custos em Produtos</Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
