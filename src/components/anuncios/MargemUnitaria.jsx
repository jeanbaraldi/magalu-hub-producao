import { Link } from 'react-router-dom'
import { brl } from '../magalu/formatos'
import { corMargem } from '../../features/anuncios/anuncios.constants'

const pct = (v) => (v == null ? null : `${Number(v).toFixed(1).replace('.', ',')}%`)

/**
 * Margem de contribuição por unidade no preço atual + quebra dos custos, no formato do
 * Gestor ML (caixa de destaque + lista compacta). Parcela desconhecida vira "—". Só props.
 */
export default function MargemUnitaria({ margem }) {
  if (margem?.bloqueado) {
    return (
      <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Margem de contribuição</p>
          <p className="text-[11px] text-slate-400 truncate">Seu acesso não inclui custos e margem.</p>
        </div>
        <p className="text-xl font-bold text-slate-300 flex-shrink-0">—</p>
      </div>
    )
  }
  const l = margem.linhas
  const semCusto = margem.faltando?.includes('custo do produto')
  const legenda = margem.mc != null
    ? 'por unidade, no preço atual'
    : semCusto ? 'cadastre o custo para calcular' : `falta: ${margem.faltando.join(', ')}`
  const comissaoRotulo = l?.comissao?.fonte === 'magalu' || l?.comissao?.fonte === 'historico'
    ? `Comissão Magalu (${pct(l.comissao.pct)})`
    : l?.comissao?.fonte === 'loja' ? `Comissão Magalu (${pct(l.comissao.pct)} média da loja)`
      : l?.comissao?.pct != null ? `Comissão (${pct(l.comissao.pct)} configurada)` : 'Comissão Magalu'
  const linhas = l ? [
    { id: 'comissao', rotulo: comissaoRotulo, valor: l.comissao.valor, vazio: '—' },
    {
      id: 'tarifa',
      rotulo: l.tarifa?.fonte === 'loja' ? 'Tarifa fixa Magalu (média da loja)' : 'Tarifa fixa Magalu',
      valor: l.tarifa?.valor ?? null,
      vazio: l.comissao.valor == null ? '—' : 'não medida',
    },
    {
      id: 'frete',
      rotulo: l.frete.fonte === 'magalu' ? 'Frete cobrado pela Magalu (média 12m)'
        : l.frete.fonte === 'estimado' ? 'Frete estimado (média da loja)'
        : l.frete.pct != null ? `Frete (${pct(l.frete.pct)} configurado)` : 'Frete',
      valor: l.frete.valor,
      vazio: 'não configurado',
    },
    {
      id: 'mdr',
      rotulo: l.mdr?.pct != null ? `Intermediação (${pct(l.mdr.pct)}${l.mdr.daLoja ? ' média da loja' : ''})` : 'Intermediação (MDR)',
      valor: l.mdr?.valor ?? null,
      vazio: 'não medida',
    },
    { id: 'custo', rotulo: 'Custo do produto', valor: l.custo.valor, vazio: '—' },
    { id: 'ads', rotulo: 'Ads por unidade', valor: null, vazio: 'não integrado' },
    { id: 'imposto', rotulo: l.imposto.pct != null ? `Impostos (${pct(l.imposto.pct)})` : 'Impostos', valor: l.imposto.valor, vazio: 'configure em Impostos' },
  ] : []

  return (
    <>
      <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Margem de contribuição</p>
          <p className="text-[11px] text-slate-400 truncate">{legenda}</p>
        </div>
        {margem.mc != null ? (
          <div className="text-right flex-shrink-0">
            <p className={`text-xl font-bold leading-tight tabular-nums ${corMargem(margem.mcPct)}`}>{brl(margem.mc)}</p>
            <p className={`text-xs font-semibold tabular-nums ${corMargem(margem.mcPct)}`}>{pct(margem.mcPct) ?? '—'}</p>
          </div>
        ) : (
          <p className="text-xl font-bold text-slate-300 flex-shrink-0" aria-label="indisponível">—</p>
        )}
      </div>
      {linhas.length > 0 && (
        <div className="mt-1.5 px-3">
          <ul className="space-y-0.5 text-[11px]">
            {linhas.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span className="text-slate-500 truncate">{r.rotulo}</span>
                {r.valor != null
                  ? <span className="font-semibold text-rose-600 tabular-nums flex-shrink-0">{`- ${brl(r.valor)}`}</span>
                  : <span className="text-slate-300 flex-shrink-0">{r.vazio}</span>}
              </li>
            ))}
          </ul>
          {(l.imposto.valor == null || l.comissao.valor == null) && (
            <Link to="/impostos" onClick={(e) => e.stopPropagation()} className="block text-[11px] text-mg-blue font-semibold hover:underline pt-0.5">Configurar impostos e comissão</Link>
          )}
        </div>
      )}
    </>
  )
}
