/**
 * Performance por SKU — funções PURAS (sem fetch, sem relógio: o "agora" chega por parâmetro).
 * Também é a base de linhas por SKU usada por Lucratividade e Rentabilidade.
 */
import { agregarPorSku } from '../magalu/itens'
import { calcularMargem, curvaAbc, custoRealDoSku } from '../magalu/margem'
import { inicioDoPeriodo } from '../magalu/vendas'
import { TENDENCIA_DIAS, TENDENCIA_LIMIAR_PCT } from './performance.constants'

/** Pedidos com `purchased_at` em [desde, ate). `ate` nulo = sem limite superior. */
export function pedidosNaJanela(pedidos, desdeIso, ateIso = null) {
  const desde = desdeIso ? Date.parse(desdeIso) : -Infinity
  const ate = ateIso ? Date.parse(ateIso) : Infinity
  return pedidos.filter((p) => {
    const t = Date.parse(p.purchased_at)
    return Number.isFinite(t) && t >= desde && t < ate
  })
}

/** Catálogo indexado por SKU (título e imagem). */
export function indexarCatalogo(skus) {
  const m = new Map()
  for (const s of skus ?? []) if (s?.sku != null) m.set(String(s.sku), { titulo: s.title ?? null, imagem: s.image_url ?? null })
  return m
}

/**
 * Linhas por SKU com título/imagem do catálogo e margem.
 * Sem acesso a valores (`podeVerValores=false`), a margem não é calculada: fica null
 * com o motivo "sem acesso" — nunca zero.
 */
export function montarLinhas(pedidos, { catalogo = new Map(), custos = new Map(), cfg = null, reais = null, podeVerValores = false } = {}) {
  const { linhas, semSku } = agregarPorSku(pedidos)
  const rows = linhas.map((l) => {
    const cat = catalogo.get(l.sku)
    const ticket = l.unidades > 0 && l.itensSemValor === 0 && l.itensSemQtd === 0 ? l.receita / l.unidades : null
    const base = {
      ...l,
      titulo: cat?.titulo ?? l.titulo ?? null,
      imagem: cat?.imagem ?? null,
      receitaParcial: l.itensSemValor > 0,
      ticket,
      custoUnit: custos.has(l.sku) ? custos.get(l.sku) : null,
    }
    if (!podeVerValores) {
      return { ...base, mc: null, mcPct: null, faltando: ['sem acesso a custos e margem'], componentes: { custo: null, comissao: null, imposto: null, frete: null, mdr: null }, semFrete: true, semMdr: true }
    }
    const m = calcularMargem(l, base.custoUnit, cfg, custoRealDoSku(reais, l.sku))
    return { ...base, mc: m.mc, mcPct: m.mcPct, faltando: m.faltando, componentes: m.componentes, semFrete: m.semFrete, semMdr: m.semMdr, fonteComissao: m.fonteComissao, fonteFrete: m.fonteFrete }
  })
  return { rows, semSku }
}

/** Tendência de receita: atual vs anterior, faixa ±limiar%. */
export function tendencia(atual, anterior, limiar = TENDENCIA_LIMIAR_PCT) {
  const a = atual ?? 0
  if (anterior == null || anterior <= 0) return a > 0 ? { tipo: 'novo', pct: null } : { tipo: null, pct: null }
  const pct = ((a - anterior) / anterior) * 100
  return { tipo: pct > limiar ? 'subindo' : pct < -limiar ? 'caindo' : 'estavel', pct }
}

function receitaPorSku(pedidos) {
  const m = new Map()
  for (const l of agregarPorSku(pedidos).linhas) m.set(l.sku, l.receita)
  return m
}

/**
 * ViewModel da Performance.
 * @param {object} p
 * @param {Array} p.pedidos pedidos lidos (podem cobrir mais que o período — a tendência usa 14 dias)
 * @param {number} p.dias período em dias
 * @param {string} p.agora ISO do momento da leitura
 */
export function mapPerformance({ pedidos = [], skus = [], custos, cfg, reais = null, podeVerValores, dias, agora }) {
  const ref = agora ? new Date(agora) : new Date(0)
  const inicio = inicioDoPeriodo(dias, ref)
  const inicio7 = inicioDoPeriodo(TENDENCIA_DIAS, ref)
  const inicio14 = inicioDoPeriodo(TENDENCIA_DIAS * 2, ref)

  const { rows: base, semSku } = montarLinhas(pedidosNaJanela(pedidos, inicio), { catalogo: indexarCatalogo(skus), custos, cfg, reais, podeVerValores })
  const rec7 = receitaPorSku(pedidosNaJanela(pedidos, inicio7))
  const rec7ant = receitaPorSku(pedidosNaJanela(pedidos, inicio14, inicio7))

  const rows = curvaAbc(base, (l) => l.receita).map((l) => ({ ...l, tendencia: tendencia(rec7.get(l.sku) ?? 0, rec7ant.get(l.sku) ?? null) }))
  return { rows, kpis: mapPerformanceKpis(rows, semSku), semSku }
}

/** KPIs sobre o PERÍODO inteiro (nunca sobre a lista filtrada). */
export function mapPerformanceKpis(rows, semSku = 0) {
  const receita = rows.reduce((s, r) => s + r.receita, 0)
  const comMc = rows.filter((r) => r.mc != null)
  const mcTotal = comMc.length > 0 ? comMc.reduce((s, r) => s + r.mc, 0) : null
  const receitaComMc = comMc.reduce((s, r) => s + r.receita, 0)
  return {
    skus: rows.length,
    receita: rows.length > 0 ? receita : null,
    itensSemValor: rows.reduce((s, r) => s + r.itensSemValor, 0),
    semSku,
    unidades: rows.reduce((s, r) => s + r.unidades, 0),
    mcTotal,
    skusComMc: comMc.length,
    skusSemMc: rows.length - comMc.length,
    margemMedia: mcTotal != null && receitaComMc > 0 ? (mcTotal / receitaComMc) * 100 : null,
  }
}

export function filtrarPerformance(rows, { busca = '', curva = 'todas' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (curva !== 'todas' && r.curva !== curva) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q) || (r.titulo ?? '').toLowerCase().includes(q)
  })
}

const VALOR_ORDEM = {
  receita: (r) => r.receita, unidades: (r) => r.unidades, ticket: (r) => r.ticket,
  custo: (r) => r.componentes.custo, comissao: (r) => r.componentes.comissao, imposto: (r) => r.componentes.imposto,
  frete: (r) => r.componentes.frete, mdr: (r) => r.componentes.mdr, mc: (r) => r.mc, mcPct: (r) => r.mcPct,
  tendencia: (r) => r.tendencia?.pct, titulo: (r) => (r.titulo ?? r.sku).toLowerCase(),
}

/** Ordena sem mutar; valores nulos vão sempre para o fim, em qualquer direção. */
export function ordenarPerformance(rows, chave = 'receita', dir = 'desc') {
  const val = VALOR_ORDEM[chave] ?? VALOR_ORDEM.receita
  const sinal = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = val(a)
    const vb = val(b)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    return (va < vb ? -1 : va > vb ? 1 : 0) * sinal
  })
}
