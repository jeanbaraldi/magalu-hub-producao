/**
 * Anúncios e Produtos do Gestor Magalu no formato do Gestor ML. Funções PURAS.
 *
 * Na Magalu o SKU é o anúncio: um cadastro, um preço, um estoque. As duas telas olham o mesmo
 * SKU com recortes diferentes: Anúncios mostra a margem por unidade no preço atual; Produtos
 * (Catálogo) mostra a contribuição de 30 dias. As duas usam `calcularMargem` (margem.js), a
 * regra única do app. Ausência de dado nunca vira zero.
 */
import { calcularMargem, curvaAbc } from '../magalu/margem'
import { STATUS_CARD } from './catalogo.constants'

const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const fracao = (pct) => (pct == null || !Number.isFinite(Number(pct)) ? null : Number(pct) / 100)

export function statusCard(status) {
  if (!status) return { label: 'Sem status', cls: 'text-slate-600 bg-slate-50' }
  const s = String(status).toLowerCase()
  return STATUS_CARD[s] ?? { label: String(status).replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), cls: 'text-slate-600 bg-slate-50' }
}

/**
 * Margem por unidade no preço atual (card de Anúncios).
 * Comissão: a taxa efetiva que a Magalu cobrou nos itens de 30 dias, aplicada ao preço; sem
 * venda (ou algum item sem comissão), o % configurado em Impostos. Custo, imposto e frete
 * como em calcularMargem. Componente desconhecido deixa a margem nula e diz o que falta.
 */
export function margemUnitaria(preco, custo, venda, cfg) {
  const faltando = []
  if (preco == null) faltando.push('preço')
  if (custo == null) faltando.push('custo do produto')
  const imposto = fracao(cfg?.tax_pct)
  if (imposto == null) faltando.push('alíquota de imposto')
  const frete = fracao(cfg?.freight_pct)
  const comissaoReal = venda && venda.receita > 0 && venda.itensSemComissao === 0 && venda.itensSemValor === 0
  const taxaComissao = comissaoReal ? venda.comissao / venda.receita : fracao(cfg?.commission_pct)
  if (taxaComissao == null) faltando.push('comissão da Magalu')
  const parts = {
    comissao: preco == null || taxaComissao == null ? null : preco * taxaComissao,
    comissaoPct: taxaComissao == null ? null : taxaComissao * 100,
    fonteComissao: comissaoReal ? 'magalu' : taxaComissao == null ? null : 'percentual',
    frete: preco == null || frete == null ? null : preco * frete,
    custo,
    impostos: preco == null || imposto == null ? null : preco * imposto,
  }
  if (faltando.length) return { mc: null, mcPct: null, faltando, parts, preco, semFrete: frete == null }
  const mc = preco - parts.comissao - (parts.frete ?? 0) - custo - parts.impostos
  return { mc, mcPct: preco > 0 ? (mc / preco) * 100 : null, faltando, parts, preco, semFrete: frete == null }
}

/**
 * Uma linha por SKU do catálogo.
 * @param {Array<object>} skus linhas de magalu.skus
 * @param {Map<string, number>} custos magalu.sku_costs
 * @param {{ linhas: Array<object> }|null} vendas agregarPorSku dos pedidos de 30 dias (null = não carregou)
 * @param {object|null} cfg account_settings
 * @param {{ podeVerValores?: boolean }} opts
 */
export function mapCatalogo(skus, custos, vendas, cfg, { podeVerValores = false } = {}) {
  const porSku = new Map((vendas?.linhas ?? []).map((l) => [l.sku, l]))
  const linhas = skus.map((r) => {
    const sku = String(r.sku)
    const preco = num(r.price)
    const precoLista = num(r.list_price)
    const custo = podeVerValores && custos.has(sku) && num(custos.get(sku)) > 0 ? num(custos.get(sku)) : null
    const v = porSku.get(sku) ?? null
    const status = String(r.status ?? '').toLowerCase()
    const unidades = vendas == null ? null : (v?.unidades ?? 0)
    const receita = vendas == null ? null : (v?.receita ?? 0)
    // Contribuição de 30 dias: só com venda (sem venda não há o que somar, nem zero).
    const m30 = v && v.unidades > 0 && podeVerValores ? calcularMargem(v, custo, cfg) : null
    return {
      sku,
      titulo: r.title?.trim() || sku,
      imagem: r.image_url ?? null,
      status,
      statusInfo: statusCard(r.status),
      ativo: status === 'published',
      pausado: status !== 'published',
      preco,
      precoLista,
      descontoPct: preco != null && precoLista != null && precoLista > preco ? (1 - preco / precoLista) * 100 : null,
      estoque: num(r.stock),
      custo,
      temCusto: custo != null,
      vendas30: unidades,
      receita30: receita,
      contribuicao30: m30?.mc ?? null,
      margem30: m30?.mcPct ?? null,
      faltando30: m30?.faltando ?? [],
      unit: podeVerValores ? margemUnitaria(preco, custo, v, cfg) : null,
    }
  })
  // Curva ABC pela receita de 30 dias, régua da suíte.
  return curvaAbc(linhas, (l) => l.receita30)
}

export function contarAbas(rows) {
  return {
    todos: rows.length,
    ativos: rows.filter((r) => r.ativo).length,
    com_custo: rows.filter((r) => r.temCusto).length,
    sem_custo: rows.filter((r) => !r.temCusto).length,
    pausados: rows.filter((r) => r.pausado).length,
  }
}

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filtrarCatalogo(rows, { aba = 'todos', busca = '' } = {}) {
  const q = fold(busca.trim())
  return rows.filter((r) => {
    if (aba === 'ativos' && !r.ativo) return false
    if (aba === 'pausados' && !r.pausado) return false
    if (aba === 'com_custo' && !r.temCusto) return false
    if (aba === 'sem_custo' && r.temCusto) return false
    return !q || fold(r.sku).includes(q) || fold(r.titulo).includes(q)
  })
}

// Desconhecido vai sempre para o fim.
const desc = (a, b) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : b - a)
const asc = (a, b) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : a - b)

export function ordenarAnuncios(rows, ordem) {
  const out = [...rows]
  switch (ordem) {
    case 'titulo': return out.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
    case 'maior_preco': return out.sort((a, b) => desc(a.preco, b.preco))
    case 'menor_preco': return out.sort((a, b) => asc(a.preco, b.preco))
    case 'menor_estoque': return out.sort((a, b) => asc(a.estoque, b.estoque))
    case 'maior_margem': return out.sort((a, b) => desc(a.unit?.mcPct ?? null, b.unit?.mcPct ?? null))
    default: return out.sort((a, b) => desc(a.vendas30, b.vendas30) || desc(a.receita30, b.receita30))
  }
}

export function ordenarCatalogo(rows, ordem) {
  const out = [...rows]
  switch (ordem) {
    case 'contribuicao': return out.sort((a, b) => desc(a.contribuicao30, b.contribuicao30))
    case 'margem': return out.sort((a, b) => desc(a.margem30, b.margem30))
    case 'vendas': return out.sort((a, b) => desc(a.vendas30, b.vendas30))
    case 'nome': return out.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
    default: return out.sort((a, b) => desc(a.receita30, b.receita30))
  }
}

/** Barra de resumo de Anúncios (mesma do Gestor ML). */
export function resumoAnuncios(rows) {
  const comPreco = rows.filter((r) => r.preco != null)
  return {
    total: rows.length,
    estoque: rows.reduce((s, r) => s + (r.estoque ?? 0), 0),
    precoMedio: comPreco.length ? comPreco.reduce((s, r) => s + r.preco, 0) / comPreco.length : null,
    vendidos30: rows.reduce((s, r) => s + (r.vendas30 ?? 0), 0),
  }
}

/**
 * Totais do Catálogo (Receita, Contribuição, Unidades). Contribuição fica pendente (null)
 * se algum SKU que vendeu não tem a contribuição calculável.
 */
export function totaisCatalogo(rows) {
  let contribuicao = 0
  let pendentes = 0
  for (const r of rows) {
    if (!r.vendas30) continue
    if (r.contribuicao30 == null) { pendentes++; contribuicao = null; continue }
    if (contribuicao != null) contribuicao += r.contribuicao30
  }
  return {
    receita: rows.reduce((s, r) => s + (r.receita30 ?? 0), 0),
    unidades: rows.reduce((s, r) => s + (r.vendas30 ?? 0), 0),
    contribuicao,
    pendentes,
  }
}
