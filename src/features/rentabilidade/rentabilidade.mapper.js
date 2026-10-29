/**
 * Rentabilidade — DRE simplificado da loja no período. Funções PURAS.
 *
 *   Receita − comissão − custo dos produtos − frete − intermediação − impostos = lucro
 * Frete e intermediação (MDR): o medido na Magalu por SKU; frete sem medição usa o frete%.
 * Comissão: a informada pela Magalu em cada item; o % de Impostos só cobre o que veio sem ela.
 *
 * O lucro só existe quando TODO componente obrigatório é conhecido para TODO o período
 * (custo de todo SKU vendido, comissão, imposto, nenhum item sem valor/quantidade/SKU).
 * Senão é null e `faltando` diz por quê. Frete é opcional: sem ele o lucro sai "sem frete".
 */
import { itensDoPedido } from '../magalu/itens'
import { inicioDoPeriodo, diaBrt, pedidoContaComoVenda } from '../magalu/vendas'
import { pedidosNaJanela, montarLinhas } from '../performance/performance.mapper'

const soma = (rows, f) => rows.reduce((s, r) => s + (f(r) ?? 0), 0)

/** Resumo do DRE a partir das linhas por SKU já com margem. */
export function resumoDre(rows, { cfg, podeVerValores, semSku = 0, pedidosSemItens = 0 }) {
  const receita = soma(rows, (r) => r.receita)
  const impostoPct = cfg?.tax_pct ?? null
  const comCusto = rows.filter((r) => r.custoUnit != null)

  const faltando = []
  if (!podeVerValores) faltando.push('seu acesso não inclui custos e margem')
  else {
    if (rows.some((r) => r.componentes?.comissao == null)) faltando.push('comissão da Magalu')
    if (impostoPct == null) faltando.push('alíquota de imposto')
    if (comCusto.length < rows.length) faltando.push(`custo de ${rows.length - comCusto.length} SKU(s)`)
    const semValor = soma(rows, (r) => r.itensSemValor)
    const semQtd = soma(rows, (r) => r.itensSemQtd)
    if (semValor > 0) faltando.push(`valor de ${semValor} item(ns)`)
    if (semQtd > 0) faltando.push(`quantidade de ${semQtd} item(ns)`)
    if (semSku > 0) faltando.push(`${semSku} item(ns) sem SKU`)
    if (pedidosSemItens > 0) faltando.push(`${pedidosSemItens} pedido(s) sem itens legíveis`)
  }

  const comissao = podeVerValores && rows.length > 0 && rows.every((r) => r.componentes?.comissao != null)
    ? soma(rows, (r) => r.componentes.comissao) : null
  const imposto = podeVerValores && impostoPct != null ? receita * impostoPct / 100 : null
  // Frete e MDR somam o que é conhecido por SKU; SKU sem nenhum dos dois fica de fora e
  // o degrau diz "parcial".
  const comFrete = rows.filter((r) => r.componentes?.frete != null)
  const comMdr = rows.filter((r) => r.componentes?.mdr != null)
  const frete = podeVerValores && comFrete.length > 0 ? soma(comFrete, (r) => r.componentes.frete) : null
  const mdr = podeVerValores && comMdr.length > 0 ? soma(comMdr, (r) => r.componentes.mdr) : null
  const custo = podeVerValores && comCusto.length > 0 ? soma(comCusto, (r) => r.componentes.custo) : null
  const completo = podeVerValores && rows.length > 0 && faltando.length === 0
  const lucro = completo ? receita - comissao - custo - imposto - (frete ?? 0) - (mdr ?? 0) : null

  const receitaComCusto = soma(comCusto, (r) => r.receita)
  return {
    receita: rows.length > 0 ? receita : null,
    comissao, custo, custoParcial: custo != null && comCusto.length < rows.length, frete, imposto, mdr,
    freteParcial: frete != null && comFrete.length < rows.length,
    mdrParcial: mdr != null && comMdr.length < rows.length,
    semFrete: frete == null,
    semMdr: mdr == null,
    freteMedido: rows.some((r) => r.fonteFrete === 'magalu' || r.fonteFrete === 'estimado'),
    lucro,
    margem: lucro != null && receita > 0 ? (lucro / receita) * 100 : null,
    completo, faltando,
    comissaoCompleta: rows.length > 0 && rows.every((r) => r.itensSemComissao === 0),
    cobertura: {
      skusVendidos: rows.length,
      skusComCusto: podeVerValores ? comCusto.length : null,
      pctReceita: podeVerValores && receita > 0 ? (receitaComCusto / receita) * 100 : null,
    },
  }
}

/** Degraus da cascata (waterfall), cada um com valor e % da receita. */
export function cascata(dre) {
  const p = (v) => (v != null && dre.receita > 0 ? (v / dre.receita) * 100 : null)
  const passos = [
    { chave: 'receita', label: 'Receita', valor: dre.receita, tipo: 'total' },
    { chave: 'comissao', label: 'Comissão', valor: dre.comissao, tipo: 'saida' },
    { chave: 'custo', label: 'Custo dos produtos', valor: dre.custo, tipo: 'saida', parcial: dre.custoParcial },
    { chave: 'frete', label: 'Frete', valor: dre.frete, tipo: 'saida', naoConfigurado: dre.semFrete, parcial: dre.freteParcial },
    { chave: 'mdr', label: 'Intermediação (MDR)', valor: dre.mdr, tipo: 'saida', naoConfigurado: dre.semMdr, parcial: dre.mdrParcial, rotuloAusente: 'não medida' },
    { chave: 'imposto', label: 'Impostos', valor: dre.imposto, tipo: 'saida' },
    { chave: 'lucro', label: 'Lucro', valor: dre.lucro, tipo: 'total' },
  ]
  // Posição de cada barra flutuante: só calculável enquanto tudo antes é conhecido.
  let nivel = dre.receita
  return passos.map((s) => {
    const pct = p(s.valor)
    if (s.tipo === 'total') return { ...s, pct, base: 0, altura: s.valor }
    if (s.naoConfigurado) return { ...s, pct: null, base: nivel, altura: null }
    if (nivel == null || s.valor == null || s.parcial) { nivel = null; return { ...s, pct, base: null, altura: null } }
    nivel -= s.valor
    return { ...s, pct, base: nivel, altura: s.valor }
  })
}

/** Dias (YYYY-MM-DD, BRT) do período, do mais antigo para hoje. */
export function diasDoPeriodo(dias, agora) {
  const inicio = Date.parse(inicioDoPeriodo(dias, new Date(agora)))
  return Array.from({ length: dias }, (_, i) => diaBrt(new Date(inicio + i * 86_400_000 + 3_600_000).toISOString()))
}

export function mapRentabilidade({ pedidos = [], custos, cfg, reais = null, podeVerValores, dias, agora }) {
  if (!agora) {
    return { dre: resumoDre([], { cfg, podeVerValores }), cascata: [], diario: [], composicao: [] }
  }
  const noPeriodo = pedidosNaJanela(pedidos, inicioDoPeriodo(dias, new Date(agora)))
  const opts = { custos, cfg, reais, podeVerValores }
  const { rows, semSku } = montarLinhas(noPeriodo, opts)
  const pedidosSemItens = noPeriodo.filter((p) => pedidoContaComoVenda(p.status) && itensDoPedido(p.payload).length === 0).length
  const dre = resumoDre(rows, { cfg, podeVerValores, semSku, pedidosSemItens })

  const porDia = new Map()
  for (const p of noPeriodo) {
    const d = diaBrt(p.purchased_at)
    if (!d) continue
    if (!porDia.has(d)) porDia.set(d, [])
    porDia.get(d).push(p)
  }
  const diario = diasDoPeriodo(dias, agora).map((d) => {
    const { rows: rd } = montarLinhas(porDia.get(d) ?? [], opts)
    const receita = soma(rd, (r) => r.receita)
    // Lucro diário só quando o período inteiro está completo (a mesma régua do total).
    const lucro = dre.completo ? soma(rd, (r) => r.mc) : null
    return { dia: d, rotulo: `${d.slice(8, 10)}/${d.slice(5, 7)}`, receita, lucro }
  })

  const composicao = dre.completo && dre.receita > 0
    ? [
      { chave: 'custo', name: 'Custo dos produtos', value: dre.custo },
      { chave: 'comissao', name: 'Comissão', value: dre.comissao },
      { chave: 'imposto', name: 'Impostos', value: dre.imposto },
      ...(dre.frete != null ? [{ chave: 'frete', name: 'Frete', value: dre.frete }] : []),
      ...(dre.mdr != null ? [{ chave: 'mdr', name: 'Intermediação (MDR)', value: dre.mdr }] : []),
      ...(dre.lucro > 0 ? [{ chave: 'lucro', name: 'Lucro', value: dre.lucro }] : []),
    ].filter((c) => c.value > 0).map((c) => ({ ...c, value: Math.round(c.value * 100) / 100 }))
    : []

  return { dre, cascata: cascata(dre), diario, composicao }
}
