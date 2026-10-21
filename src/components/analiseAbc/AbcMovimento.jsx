/** Resumo da comparação de classe com o período anterior. */
export default function AbcMovimento({ resumo, loading }) {
  if (loading) return null
  if (!resumo.temAnterior) {
    return <p className="text-xs text-slate-500">Sem vendas no período anterior: não há classe para comparar (todos aparecem como novos).</p>
  }
  const itens = [
    { label: 'Subiram de classe', v: resumo.subiu, cor: 'text-emerald-600' },
    { label: 'Desceram', v: resumo.desceu, cor: 'text-rose-600' },
    { label: 'Novos na curva', v: resumo.novo, cor: 'text-violet-600' },
    { label: 'Saíram (venderam antes, não agora)', v: resumo.saiu, cor: 'text-slate-600' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {itens.map((i) => (
        <div key={i.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className={`text-xl font-bold tabular-nums ${i.cor}`}>{i.v}</p>
          <p className="text-xs text-slate-500">{i.label}</p>
        </div>
      ))}
    </div>
  )
}
