import { Link } from 'react-router-dom'
import { brl } from '../magalu/formatos'
import { corMargem } from '../../features/anuncios/anuncios.constants'

const pct = (v) => (v == null ? null : `${Number(v).toFixed(1).replace('.', ',')}%`)

function Linha({ rotulo, valor, vazio = '—', dica }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs" title={dica}>
      <span className="text-slate-500 truncate">{rotulo}</span>
      <span className={`tabular-nums font-medium ${valor == null ? 'text-slate-400' : 'text-rose-600'}`}>
        {valor == null ? vazio : `- ${brl(valor)}`}
      </span>
    </div>
  )
}

/** Margem de contribuição por unidade no preço atual + a quebra dos custos. Só props. */
export default function MargemUnitaria({ margem }) {
  if (margem?.bloqueado) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Margem de contribuição</p>
        <p className="text-xs text-slate-400 mt-0.5">Seu acesso não inclui custos e margem.</p>
      </div>
    )
  }
  const l = margem.linhas
  const semCusto = margem.faltando?.includes('custo do produto')
  const legenda = margem.mc != null
    ? 'por unidade, no preço atual'
    : semCusto ? 'cadastre o custo para calcular' : `falta: ${margem.faltando.join(', ')}`
  const comissaoRotulo = l?.comissao?.fonte === 'magalu'
    ? `Comissão Magalu (${pct(l.comissao.pct)})`
    : l?.comissao?.pct != null ? `Comissão (${pct(l.comissao.pct)} configurada)` : 'Comissão Magalu'

  return (
    <div>
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Margem de contribuição</p>
          <p className="text-[11px] text-slate-400 truncate">{legenda}</p>
        </div>
        {margem.mc != null ? (
          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold tabular-nums leading-tight ${corMargem(margem.mcPct)}`}>{brl(margem.mc)}</p>
            <p className={`text-xs font-semibold tabular-nums ${corMargem(margem.mcPct)}`}>{pct(margem.mcPct) ?? '—'}</p>
          </div>
        ) : (
          <span className="text-slate-300 text-lg font-bold" aria-label="indisponível">—</span>
        )}
      </div>
      {l && (
        <div className="px-3 pt-2 space-y-1">
          <Linha rotulo={comissaoRotulo} valor={l.comissao.valor} dica={l.comissao.fonte === 'magalu' ? 'Taxa real das vendas dos últimos 30 dias' : undefined} />
          <Linha rotulo={l.frete.pct != null ? `Frete (${pct(l.frete.pct)} configurado)` : 'Frete'} valor={l.frete.valor} vazio="não configurado" />
          <Linha rotulo="Custo do produto" valor={l.custo.valor} />
          <Linha rotulo="Ads por unidade" valor={null} vazio="não integrado" dica="Ads da Magalu ainda não integrado ao Gestor" />
          <Linha rotulo={l.imposto.pct != null ? `Impostos (${pct(l.imposto.pct)})` : 'Impostos'} valor={l.imposto.valor} vazio="configure em Impostos" />
          {(l.imposto.valor == null || l.comissao.valor == null) && (
            <Link to="/impostos" className="block text-[11px] text-mg-blue font-semibold hover:underline pt-0.5">Configurar impostos e comissão</Link>
          )}
        </div>
      )}
    </div>
  )
}
