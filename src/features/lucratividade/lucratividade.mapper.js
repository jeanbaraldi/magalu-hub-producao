/**
 * Lucratividade — curva ABC por LUCRO (MC R$). Funções PURAS.
 * Ninguém some: SKU com MC desconhecida fica na faixa "pendente" com o motivo;
 * MC ≤ 0 não entra na curva de lucro e aparece como prejuízo/sem lucro.
 */
import { curvaAbc } from '../magalu/margem'
import { inicioDoPeriodo } from '../magalu/vendas'
import { pedidosNaJanela, indexarCatalogo, montarLinhas } from '../performance/performance.mapper'

const CLASSES = ['A', 'B', 'C']

export function faixaDe(r) {
  if (r.mc == null) return 'pendente'
  if (r.mc < 0) return 'negativo'
  if (r.mc === 0) return 'zero'
  return r.curvaLucro
}

/** Matriz 3×3: classe de receita (linhas) × classe de lucro (colunas). */
export function matrizReceitaLucro(rows) {
  const m = {}
  for (const cr of CLASSES) {
    m[cr] = {}
    for (const cl of CLASSES) m[cr][cl] = { skus: 0, receita: 0, lucro: 0 }
  }
  let fora = 0
  for (const r of rows) {
    if (!r.curvaReceita || !r.curvaLucro) { if (r.curvaReceita) fora++; continue }
    const c = m[r.curvaReceita][r.curvaLucro]
    c.skus++
    c.receita += r.receita
    c.lucro += r.mc
  }
  return { celulas: m, fora }
}

/** Quantos SKUs pendentes por motivo (um SKU pode ter mais de um). */
export function pendenciasPorMotivo(rows) {
  const m = new Map()
  for (const r of rows) if (r.mc == null) for (const f of r.faltando) m.set(f, (m.get(f) ?? 0) + 1)
  return [...m.entries()].map(([motivo, skus]) => ({ motivo, skus })).sort((a, b) => b.skus - a.skus)
}

export function mapLucratividade({ pedidos = [], skus = [], custos, cfg, reais = null, podeVerValores, dias, agora }) {
  const ref = agora ? new Date(agora) : new Date(0)
  const inicio = inicioDoPeriodo(dias, ref)
  const { rows: base, semSku } = montarLinhas(pedidosNaJanela(pedidos, inicio), { catalogo: indexarCatalogo(skus), custos, cfg, reais, podeVerValores })

  const porReceita = new Map(curvaAbc(base, (l) => l.receita).map((l) => [l.sku, l.curva]))
  const comLucro = curvaAbc(base, (l) => l.mc)
  const rows = comLucro.map((l) => {
    const r = { ...l, curvaReceita: porReceita.get(l.sku) ?? null, curvaLucro: l.curva, participacaoLucro: l.participacao }
    return { ...r, faixa: faixaDe(r) }
  }).sort((a, b) => {
    // Lucro decrescente; depois prejuízo (mais negativo por último); pendentes no fim por receita.
    if (a.mc == null && b.mc == null) return b.receita - a.receita
    if (a.mc == null) return 1
    if (b.mc == null) return -1
    return b.mc - a.mc
  })

  const conhecidos = rows.filter((r) => r.mc != null)
  const lucrativos = rows.filter((r) => r.mc != null && r.mc > 0)
  const negativos = rows.filter((r) => r.mc != null && r.mc < 0)
  return {
    rows,
    semSku,
    matriz: matrizReceitaLucro(rows),
    pendencias: pendenciasPorMotivo(rows),
    composicao: CLASSES.map((c) => {
      const g = rows.filter((r) => r.curvaLucro === c)
      const lucro = g.reduce((s, r) => s + r.mc, 0)
      const receita = g.reduce((s, r) => s + r.receita, 0)
      return { curva: c, skus: g.length, lucro: g.length ? lucro : null, receita, margem: receita > 0 ? (lucro / receita) * 100 : null }
    }),
    kpis: {
      skus: rows.length,
      lucroTotal: conhecidos.length > 0 ? conhecidos.reduce((s, r) => s + r.mc, 0) : null,
      lucrativos: lucrativos.length,
      negativos: negativos.length,
      prejuizo: negativos.length > 0 ? negativos.reduce((s, r) => s + r.mc, 0) : null,
      pendentes: rows.length - conhecidos.length,
      receitaPendente: rows.filter((r) => r.mc == null).reduce((s, r) => s + r.receita, 0),
    },
  }
}

export function filtrarLucratividade(rows, { busca = '', faixa = 'todas' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (faixa === 'negativo' && r.faixa !== 'negativo') return false
    if (faixa === 'pendente' && r.faixa !== 'pendente') return false
    if (CLASSES.includes(faixa) && r.curvaLucro !== faixa) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q) || (r.titulo ?? '').toLowerCase().includes(q)
  })
}
