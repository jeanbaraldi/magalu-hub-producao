/** Mostra o retorno do magalu-sync como veio: quantos leu, se truncou, erro por tipo. */
export default function ResultadoSync({ resultado }) {
  if (!resultado) return null
  if (!resultado.ok) {
    return <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{`A sincronização falhou: ${resultado.erro}`}</div>
  }
  const lojas = resultado.corpo?.accounts ?? []
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 space-y-1">
      <p className="font-semibold">Sincronização concluída</p>
      {lojas.length === 0 && <p className="text-xs">Nenhuma loja liberada para sincronizar.</p>}
      {lojas.filter(Boolean).map((l, i) => (
        <p key={i} className="text-xs">
          {l?.error ? `Erro na loja: ${l.error}` : l?.skipped ? 'Sem tempo nesta rodada; a próxima continua.' : ['skus', 'orders'].filter((k) => l?.[k]).map((k) => {
            const r = l[k]
            const nome = k === 'skus' ? 'SKUs' : 'Pedidos'
            if (r.error) return `${nome}: erro — ${r.error}`
            return `${nome}: ${r.fetched ?? 0} lidos${r.truncated ? ' (parcial, continua na próxima rodada)' : ''}`
          }).join(' · ') || 'Sem detalhes no retorno.'}
        </p>
      ))}
    </div>
  )
}
