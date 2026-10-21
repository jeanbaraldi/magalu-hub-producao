import { brl } from '../magalu/formatos'

const CLASSES = ['A', 'B', 'C']
const LEITURA = {
  AA: 'Carro-chefe: vende e deixa dinheiro',
  AC: 'Vende muito, deixa pouco: revisar preço/custo',
  CA: 'Vende pouco, deixa bem: dar visibilidade',
}

/** Classe ABC de receita (linhas) × classe ABC de lucro (colunas). */
export default function MatrizReceitaLucro({ matriz }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900">Receita × lucro</h2>
      <p className="text-xs text-slate-400 mb-4">Fora da diagonal mora a decisão: quem vende muito e deixa pouco, ou o contrário</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400 font-medium">Receita ↓ / Lucro →</th>
              {CLASSES.map((c) => <th key={c} className="p-2 text-center text-slate-600 font-semibold">{`Lucro ${c}`}</th>)}
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((cr) => (
              <tr key={cr}>
                <th className="p-2 text-left text-slate-600 font-semibold">{`Receita ${cr}`}</th>
                {CLASSES.map((cl) => {
                  const c = matriz.celulas[cr][cl]
                  const diag = cr === cl
                  return (
                    <td key={cl} className={`p-2 align-top border border-slate-100 ${c.skus === 0 ? 'bg-slate-50/50' : diag ? 'bg-emerald-50/60' : 'bg-amber-50/60'}`} title={LEITURA[cr + cl]}>
                      <p className="text-base font-bold tabular-nums text-slate-900">{c.skus}</p>
                      {c.skus > 0 && <p className="text-slate-500 tabular-nums">{`${brl(c.receita)} · MC ${brl(c.lucro)}`}</p>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {matriz.fora > 0 && <p className="text-xs text-slate-500 mt-3">{`${matriz.fora} SKU(s) vendido(s) fora da matriz: lucro pendente, zero ou negativo.`}</p>}
    </div>
  )
}
