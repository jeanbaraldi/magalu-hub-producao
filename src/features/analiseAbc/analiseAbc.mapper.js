/**
 * Análise ABC por SKU — funções PURAS. A classificação é feita sobre a base inteira do
 * período; busca e filtro só escondem linhas, nunca reclassificam.
 */
import { agregarPorSku } from '../magalu/itens'
import { curvaAbc } from '../magalu/margem'
import { inicioDoPeriodo } from '../magalu/vendas'
import { pedidosNaJanela, indexarCatalogo } from '../performance/performance.mapper'

const ORDEM_CLASSE = { A: 0, B: 1, C: 2 }

/**
 * Valor da métrica do SKU. Se TODOS os itens estão sem o dado, é null (não zero).
 * Dado parcial entra com o que se sabe e a linha fica marcada `parcial`.
 */
export function valorDaMetrica(l, metrica) {
  if (metrica === 'unidades') {
    if (l.unidades === 0 && l.itensSemQtd > 0) return null
    return l.unidades
  }
  if (l.receita === 0 && l.itensSemValor > 0) return null
  return l.receita
}

/** Classifica as linhas e calcula participação e acumulado (na ordem da curva). */
export function classificar(linhas, metrica) {
  const comValor = linhas.map((l) => ({
    ...l,
    valor: valorDaMetrica(l, metrica),
    parcial: metrica === 'unidades' ? l.itensSemQtd > 0 : l.itensSemValor > 0,
  }))
  const curva = curvaAbc(comValor, (l) => l.valor)
  const ordenados = [...curva].sort((a, b) => (b.valor ?? -Infinity) - (a.valor ?? -Infinity))
  let acumulado = 0
  return ordenados.map((l, i) => {
    if (l.curva) acumulado += l.participacao
    return { ...l, posicao: l.curva ? i + 1 : null, acumulado: l.curva ? Math.min(acumulado, 100) : null }
  })
}

export function movimento(classeAtual, classeAnterior) {
  if (!classeAtual) return null
  if (!classeAnterior) return 'novo'
  const d = ORDEM_CLASSE[classeAnterior] - ORDEM_CLASSE[classeAtual]
  return d > 0 ? 'subiu' : d < 0 ? 'desceu' : 'manteve'
}

export function composicao(rows) {
  const total = rows.reduce((s, r) => s + (r.curva ? r.valor : 0), 0)
  const totalSkus = rows.filter((r) => r.curva).length
  return ['A', 'B', 'C'].map((c) => {
    const doGrupo = rows.filter((r) => r.curva === c)
    const valor = doGrupo.reduce((s, r) => s + r.valor, 0)
    return {
      curva: c,
      skus: doGrupo.length,
      pctSkus: totalSkus > 0 ? (doGrupo.length / totalSkus) * 100 : null,
      valor,
      pctValor: total > 0 ? (valor / total) * 100 : null,
    }
  })
}

/**
 * ViewModel da Análise ABC: período atual × período anterior de mesmo tamanho.
 * `pedidos` deve cobrir os dois períodos (2 × dias).
 */
export function mapAnaliseAbc({ pedidos = [], skus = [], dias, agora, metrica = 'receita' }) {
  const ref = agora ? new Date(agora) : new Date(0)
  const inicio = inicioDoPeriodo(dias, ref)
  const inicioAnterior = inicioDoPeriodo(dias * 2, ref)
  const catalogo = indexarCatalogo(skus)

  const { linhas: atuais, semSku } = agregarPorSku(pedidosNaJanela(pedidos, inicio))
  const { linhas: anteriores } = agregarPorSku(pedidosNaJanela(pedidos, inicioAnterior, inicio))
  const classeAnterior = new Map(classificar(anteriores, metrica).filter((l) => l.curva).map((l) => [l.sku, l.curva]))

  const rows = classificar(atuais, metrica).map((l) => {
    const cat = catalogo.get(l.sku)
    const anterior = classeAnterior.get(l.sku) ?? null
    return { ...l, titulo: cat?.titulo ?? l.titulo ?? null, imagem: cat?.imagem ?? null, curvaAnterior: anterior, movimento: movimento(l.curva, anterior) }
  })
  const atuaisNaCurva = new Set(rows.filter((r) => r.curva).map((r) => r.sku))
  const saiu = [...classeAnterior.keys()].filter((sku) => !atuaisNaCurva.has(sku)).length

  const naCurva = rows.filter((r) => r.curva)
  return {
    rows,
    composicao: composicao(rows),
    pareto: naCurva.map((r) => ({ sku: r.sku, rotulo: r.titulo ?? r.sku, valor: r.valor, acumulado: r.acumulado, curva: r.curva })),
    resumo: {
      skus: rows.length,
      naCurva: naCurva.length,
      foraDaCurva: rows.length - naCurva.length,
      parciais: rows.filter((r) => r.parcial).length,
      total: naCurva.length > 0 ? naCurva.reduce((s, r) => s + r.valor, 0) : null,
      semSku,
      subiu: rows.filter((r) => r.movimento === 'subiu').length,
      desceu: rows.filter((r) => r.movimento === 'desceu').length,
      novo: rows.filter((r) => r.movimento === 'novo').length,
      saiu,
      temAnterior: classeAnterior.size > 0,
    },
  }
}

export function filtrarAbc(rows, { busca = '', curva = 'todas', movimento: mov = 'todos' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (curva !== 'todas' && r.curva !== curva) return false
    if (mov !== 'todos' && r.movimento !== mov) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q) || (r.titulo ?? '').toLowerCase().includes(q)
  })
}
