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
  const fretePctReal = !freteMedido && real?.fretePct != null && Number.isFinite(real.fretePct) ? real.fretePct : null
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
    frete: freteMedido ? real.fretePorUnidade * venda.unidades
      : fretePctReal != null ? receita * fretePctReal
        : fretePct == null ? null : receita * fretePct,
    mdr: mdrMedido ? receita * real.mdrPct : null,
  }
  const semFrete = componentes.frete == null
  const fonteFrete = freteMedido ? (real.freteEstimado ? 'estimado' : 'magalu')
    : fretePctReal != null ? 'estimado' : fretePct == null ? null : 'percentual'
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
 * Faixas de peso cobrado (g) para estimar o frete de SKU que nunca vendeu: média do frete
 * por unidade dos SKUs MEDIDOS da loja na mesma faixa. Frete da Magalu depende do peso e do
 * destino, então é estimativa e a tela diz isso.
 */
export const FAIXAS_PESO_G = [1000, 2000, 5000, 10000, Infinity]
/** SKUs medidos que uma faixa precisa ter para servir de estimativa. */
export const MIN_SKUS_FAIXA = 2

const faixaDoPeso = (g) => (g == null || !(g > 0) ? null : FAIXAS_PESO_G.findIndex((lim) => g <= lim))

/**
 * Peso cobrado da embalagem em gramas: o maior entre o real e o cubado (C × L × A ÷ 6000,
 * em kg). Lê `dimensions` do SKU da Magalu (item `name: package`, senão o primeiro).
 * Medida ausente ou em unidade desconhecida → null.
 */
export function pesoCobradoG(dimensions) {
  if (!Array.isArray(dimensions)) return null
  const d = dimensions.find((x) => x?.name === 'package') ?? dimensions[0]
  if (!d) return null
  const em = (v, unidades) => (v && unidades[v.unit] != null && Number.isFinite(Number(v.value)) ? Number(v.value) * unidades[v.unit] : null)
  const peso = em(d.weight, { g: 1, kg: 1000 })
  const cm = { cm: 1, m: 100, mm: 0.1 }
  const [l, w, h] = [em(d.length, cm), em(d.width, cm), em(d.height, cm)]
  const cubado = l != null && w != null && h != null ? (l * w * h) / 6000 * 1000 : null
  if (peso == null && cubado == null) return null
  return Math.max(peso ?? 0, cubado ?? 0)
}

/**
 * Linhas de magalu.v_custos_reais_sku → { porSku, mdrPctLoja, fretePorFaixa }.
 * SKU sem venda medida recebe a TAXA de intermediação média da loja (é % da venda e varia
 * pouco) e o frete estimado pela faixa de peso (`pesos`: Map sku → peso cobrado em g).
 */
export function custosReaisPorSku(linhas, pesos = new Map()) {
  const porSku = new Map()
  let vendaLoja = 0
  let mdrLoja = 0
  let vendaCom = 0
  let comissaoLoja = 0
  let vendaFrete = 0
  let freteLoja = 0
  const faixas = FAIXAS_PESO_G.map(() => ({ frete: 0, unidades: 0, skus: 0 }))
  for (const l of linhas ?? []) {
    const unidades = Number(l.unidades_vendidas)
    const venda = Number(l.venda)
    const frete = l.frete == null ? null : Number(l.frete)
    const mdr = l.mdr == null ? null : Number(l.mdr)
    const comissao = l.comissao == null ? null : Number(l.comissao)
    if (!(unidades >= MIN_UNIDADES_MEDIDAS)) continue
    if (venda > 0 && mdr != null) { vendaLoja += venda; mdrLoja += mdr }
    if (venda > 0 && comissao != null) { vendaCom += venda; comissaoLoja += comissao }
    if (venda > 0) { vendaFrete += venda; freteLoja += frete ?? 0 }
    // Venda medida sem nenhum débito de frete = frete zero de verdade (a Magalu bancou).
    const fretePorUnidade = frete == null ? 0 : frete / unidades
    porSku.set(String(l.sku), {
      unidades, fretePorUnidade,
      mdrPct: venda > 0 && mdr != null ? mdr / venda : null,
      comissaoPct: venda > 0 && comissao != null ? comissao / venda : null,
    })
    const f = faixaDoPeso(pesos.get(String(l.sku)))
    if (f != null && f >= 0) { faixas[f].frete += fretePorUnidade * unidades; faixas[f].unidades += unidades; faixas[f].skus++ }
  }
  const mdrPctLoja = vendaLoja > 0 ? mdrLoja / vendaLoja : null
  const comissaoPctLoja = vendaCom > 0 ? comissaoLoja / vendaCom : null
  // Último recurso para SKU sem faixa de peso medida: frete médio da loja em % da venda.
  const fretePctLoja = vendaFrete > 0 ? freteLoja / vendaFrete : null
  const fretePorFaixa = faixas.map((x) => (x.skus >= MIN_SKUS_FAIXA && x.unidades > 0 ? { valor: x.frete / x.unidades, skus: x.skus } : null))
  return { porSku, mdrPctLoja, comissaoPctLoja, fretePctLoja, fretePorFaixa, pesos }
}

/**
 * Custo real de um SKU: o medido nas vendas dele (12 meses); sem venda, frete estimado pela
 * faixa de peso (`pesoG`) e intermediação/comissão médias da loja. `freteEstimado` e
 * `comissaoDaLoja` dizem qual.
 */
export function custoRealDoSku(reais, sku, pesoG = reais?.pesos?.get(String(sku)) ?? null) {
  if (!reais) return null
  const d = reais.porSku.get(String(sku))
  if (d) {
    return {
      fretePorUnidade: d.fretePorUnidade, mdrPct: d.mdrPct ?? reais.mdrPctLoja, unidadesMedidas: d.unidades, freteEstimado: false,
      comissaoPct: d.comissaoPct ?? reais.comissaoPctLoja ?? null, comissaoDaLoja: d.comissaoPct == null,
    }
  }
  const f = faixaDoPeso(pesoG)
  const est = f != null && f >= 0 ? reais.fretePorFaixa?.[f] ?? null : null
  if (!est && reais.mdrPctLoja == null && reais.comissaoPctLoja == null && reais.fretePctLoja == null) return null
  return {
    // Sem faixa de peso: o % médio de frete da loja sobre a venda.
    fretePct: est ? null : reais.fretePctLoja ?? null,
    comissaoPct: reais.comissaoPctLoja ?? null,
    comissaoDaLoja: true,
    fretePorUnidade: est ? est.valor : null,
    mdrPct: reais.mdrPctLoja,
    unidadesMedidas: 0,
    freteEstimado: !!est,
    skusNaFaixa: est?.skus ?? null,
  }
}
