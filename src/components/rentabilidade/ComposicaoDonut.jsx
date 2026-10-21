import DonutChart from '../ui/DonutChart'
import { brl } from '../magalu/formatos'
import { pct } from '../performance/percentual'
import { CORES } from '../../features/rentabilidade/rentabilidade.constants'

/** Para onde vai cada real da receita. Só existe com o DRE completo. */
export default function ComposicaoDonut({ composicao, dre }) {
  const dados = composicao.map((c) => ({ ...c, color: CORES[c.chave] }))
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Composição da receita</h2>
      <p className="text-xs text-slate-400 mb-4">Para onde vai cada real vendido</p>
      {dados.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">{dre.receita == null ? 'Sem vendas no período' : 'Indisponível até custo, comissão e imposto estarem completos'}</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <DonutChart data={dados} centerLabel={pct(dre.margem, 0)} centerSublabel="margem" />
          <ul className="space-y-1.5 text-xs flex-1 w-full">
            {dados.map((d) => (
              <li key={d.chave} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>
                <span className="tabular-nums text-slate-800">{`${brl(d.value)} · ${pct((d.value / dre.receita) * 100)}`}</span>
              </li>
            ))}
            {dre.lucro != null && dre.lucro <= 0 && <li className="text-rose-600">{`Prejuízo de ${brl(dre.lucro)}: os custos passam da receita.`}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
