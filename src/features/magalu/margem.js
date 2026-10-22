/**
 * Margem de contribuição por SKU — regra única do Gestor Magalu.
 *
 *   MC = receita − custo × unidades − comissão − imposto% × receita − frete − intermediação
 *
 * Frete e intermediação (MDR): o MEDIDO na análise financeira da Magalu quando há
 * (`real.fretePorUnidade` × unidades, `real.mdrPct` × receita); senão o frete% configurado.
 * Intermediação não medida fica fora da conta e marcada `semMdr`.
 * Comissão: a que a Magalu informa em cada item do pedido (amounts.commission). Só quando
 * algum item vendido veio sem ela entra o percentual configurado em Impostos.
 *
 * Cada componente desconhecido deixa a MC INDISPONÍVEL (null) e diz qual faltou.
 * Nunca trata ausência como zero: custo não cadastrado não é custo zero.
 * Frete é opcional na configuração; sem ele a MC sai, mas marcada `semFrete`.
 */

/** Percentual 0-100 → fração, ou null. */
const fracao = (pct) => (pct == null || !Number.isFinite(Number(pct)) ? null : Number(pct) / 100)

/**
 * @param {{ receita:number, unidades:number, comissao?:number, itensSemComissao?:number, itensSemValor?:number, itensSemQtd?:number }} venda
 * @param {number|null|undefined} custoUnit custo do produto cadastrado
 * @param {{ tax_pct?:number|null, commission_pct?:number|null, freight_pct?:number|null }|null} cfg
 * @param {{ fretePorUnidade?:number|null, mdrPct?:number|null }|null} [real] medido na Magalu
 */
export function calcularMargem(venda, custoUnit, cfg, real = null) {
  const faltando = []
  if ((venda.itensSemValor ?? 0) > 0) faltando.push('valor de item')
  if ((venda.itensSemQtd ?? 0) > 0) faltando.push('quantidade de item')
  if (custoUnit == null || !Number.isFinite(Number(custoUnit))) faltando.push('custo do produto')
  const imposto = fracao(cfg?.tax_pct)
  const comissaoPct = fracao(cfg?.commission_pct)
  const fretePct = fracao(cfg?.freight_pct)
  const freteMedido = real?.fretePorUnidade != null && Number.isFinite(real.fretePorUnidade)
  const mdrMedido = real?.mdrPct != null && Number.isFinite(real.mdrPct)
  if (imposto == null) faltando.push('alíquota de imposto')
  const receita = venda.receita
  const comissaoReal = venda.comissao != null && venda.itensSemComissao === 0
  const valorComissao = comissaoReal ? venda.comissao : comissaoPct == null ? null : receita * comissaoPct
  const fonteComissao = comissaoReal ? 'magalu' : comissaoPct == null ? null : 'percentual'
  if (valorComissao == null) faltando.push('comissão da Magalu')

  const componentes = {
    custo: custoUnit == null ? null : Number(custoUnit) * venda.unidades,
    comissao: valorComissao,
    imposto: imposto == null ? null : receita * imposto,
    frete: freteMedido ? real.fretePorUnidade * venda.unidades : fretePct == null ? null : receita * fretePct,
    mdr: mdrMedido ? receita * real.mdrPct : null,
  }
  const semFrete = componentes.frete == null
  const fonteFrete = freteMedido ? 'magalu' : fretePct == null ? null : 'percentual'
  const extra = { semFrete, semMdr: !mdrMedido, fonteComissao, fonteFrete }
  if (faltando.length > 0) return { mc: null, mcPct: null, faltando, componentes, ...extra }

  const mc = receita - componentes.custo - componentes.comissao - componentes.imposto - (componentes.frete ?? 0) - (componentes.mdr ?? 0)
  return { mc, mcPct: receita > 0 ? (mc / receita) * 100 : null, faltando, componentes, ...extra }
}

/**
 * Curva ABC com a régua da suíte: o item que CRUZA 80% ainda é A; o que cruza 95% ainda é B.
 * Itens com valor ≤ 0 ou null ficam fora da curva (classe null).
 * @param {Array<object>} linhas
 * @param {(l:object)=>number|null} valorDe
 */
export function curvaAbc(linhas, valorDe) {
  const validos = linhas.filter((l) => { const v = valorDe(l); return v != null && v > 0 })
  const total = validos.reduce((s, l) => s + valorDe(l), 0)
  const ordenados = [...validos].sort((a, b) => valorDe(b) - valorDe(a))
  const classe = new Map()
  let acumulado = 0
  for (const l of ordenados) {
    const antes = total > 0 ? acumulado / total : 0
    acumulado += valorDe(l)
    classe.set(l, antes < 0.8 ? 'A' : antes < 0.95 ? 'B' : 'C')
  }
  return linhas.map((l) => {
    const v = valorDe(l)
    return {
      ...l,
      curva: classe.get(l) ?? null,
      participacao: total > 0 && v != null && v > 0 ? (v / total) * 100 : null,
    }
  })
}

/** Mínimo de unidades medidas para usar o frete/MDR do próprio SKU (abaixo disso, média da loja). */
export const MIN_UNIDADES_MEDIDAS = 1

/**
 * Linhas de magalu.v_custos_reais_sku → Map sku → { fretePorUnidade, mdrPct, unidades, fonte }.
 * SKU sem venda medida recebe a TAXA de intermediação média da loja (é % da venda e varia
 * pouco); o frete NÃO é estimado pela loja (depende do tamanho do produto): fica null.
 */
export function custosReaisPorSku(linhas) {
  const porSku = new Map()
  let vendaLoja = 0
  let mdrLoja = 0
  for (const l of linhas ?? []) {
    const unidades = Number(l.unidades_vendidas)
    const venda = Number(l.venda)
    const frete = l.frete == null ? null : Number(l.frete)
    const mdr = l.mdr == null ? null : Number(l.mdr)
    if (!(unidades >= MIN_UNIDADES_MEDIDAS)) continue
    if (venda > 0 && mdr != null) { vendaLoja += venda; mdrLoja += mdr }
    porSku.set(String(l.sku), {
      unidades,
      // Venda medida sem nenhum débito de frete = frete zero de verdade (a Magalu bancou).
      fretePorUnidade: frete == null ? 0 : frete / unidades,
      mdrPct: venda > 0 && mdr != null ? mdr / venda : null,
    })
  }
  const mdrPctLoja = vendaLoja > 0 ? mdrLoja / vendaLoja : null
  return { porSku, mdrPctLoja }
}

/** Custo real de um SKU (o dele, ou a taxa de intermediação média da loja). */
export function custoRealDoSku(reais, sku) {
  if (!reais) return null
  const d = reais.porSku.get(String(sku))
  if (d) return { fretePorUnidade: d.fretePorUnidade, mdrPct: d.mdrPct ?? reais.mdrPctLoja, unidadesMedidas: d.unidades }
  return reais.mdrPctLoja == null ? null : { fretePorUnidade: null, mdrPct: reais.mdrPctLoja, unidadesMedidas: 0 }
}
