/**
 * Anúncios — mapper PURO (sem React, sem fetch). Monta o card de cada SKU no formato da
 * página de Anúncios do Gestor ML: preço, vendas 30d, estoque e margem de contribuição
 * por unidade no preço atual.
 */
import { calcularMargem } from '../magalu/margem'
import { STATUS_SKU, ESTOQUE_BAIXO } from './anuncios.constants'

const ATIVOS = new Set(['active', 'ativo', 'published'])
const NAO_PUBLICADOS = new Set(['unpublished', 'new', 'paused', 'inactive', 'inativo', 'under_review'])

const ehObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

export function statusSku(status) {
  if (!status) return { label: 'Sem status', tone: 'slate' }
  const s = String(status).toLowerCase()
  return STATUS_SKU[s] ?? { label: String(status).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), tone: 'slate' }
}

/** Link público do anúncio na Magalu (url_marketplace do canal magazineluiza). */
function urlDoAnuncio(payload) {
  const lista = Array.isArray(payload?.url_marketplace) ? payload.url_marketplace : []
  const daMagalu = lista.find((u) => ehObj(u) && u.channel === 'magazineluiza' && u.url) ?? lista.find((u) => ehObj(u) && u.url)
  return daMagalu?.url ?? null
}

export function mapSkuRow(r) {
  // Aceita o payload cru ou só os campos dele trazidos por alias no select.
  const p = ehObj(r.payload) ? r.payload : r
  const preco = num(r.price)
  const lista = num(r.list_price)
  const status = String(r.status ?? '').toLowerCase()
  return {
    sku: String(r.sku),
    titulo: r.title,
    status: r.status,
    statusInfo: statusSku(r.status),
    ativo: ATIVOS.has(status),
    naoPublicado: NAO_PUBLICADOS.has(status),
    preco,
    precoLista: lista,
    // Desconto só existe com os dois preços conhecidos e o de lista maior.
    descontoPct: preco != null && lista != null && lista > preco ? (1 - preco / lista) * 100 : null,
    estoque: num(r.stock),
    imagem: r.image_url,
    // Contagens só quando o campo veio como lista: ausente é desconhecido (null), não zero.
    fotos: Array.isArray(p.images) ? p.images.length : null,
    videos: Array.isArray(p.videos) ? p.videos.length : null,
    marca: typeof p.brand === 'string' && p.brand.trim() ? p.brand.trim() : null,
    grupoId: ehObj(p.group) && p.group.id ? String(p.group.id) : null,
    variacaoPrincipal: ehObj(p.group) ? p.group.main_variation === true : false,
    full: typeof p.fulfillment === 'boolean' ? p.fulfillment : null,
    url: urlDoAnuncio(p),
    sincronizadoEm: r.synced_at,
  }
}

/**
 * Comissão PERCENTUAL observada nas vendas do SKU: (comissão − tarifa fixa) ÷ receita, só
 * quando todos os itens vieram com valor, comissão e tarifa. Senão null (cai no % configurado).
 */
export function taxaComissaoObservada(venda) {
  if (!venda || venda.receita <= 0) return null
  if ((venda.itensSemComissao ?? 0) > 0 || (venda.itensSemValor ?? 0) > 0) return null
  return (venda.comissao - (venda.tarifaFixa ?? 0)) / venda.receita
}

/** Tarifa fixa por unidade observada nas vendas do SKU (R$), ou null. */
export function tarifaFixaObservada(venda) {
  if (!venda || (venda.itensSemComissao ?? 0) > 0 || !(venda.unidadesComTarifa > 0)) return null
  return venda.tarifaFixa / venda.unidadesComTarifa
}

/**
 * Tarifa fixa média por unidade da loja (todas as vendas medidas), para SKU sem venda.
 * É estimativa: a Magalu cobra R$ 5,00 ou R$ 5,50 conforme o SKU.
 */
export function tarifaFixaDaLoja(vendas) {
  let tarifa = 0
  let unidades = 0
  for (const v of vendas.values()) {
    if (v.unidadesComTarifa > 0) { tarifa += v.tarifaFixa; unidades += v.unidadesComTarifa }
  }
  return unidades > 0 ? tarifa / unidades : null
}

/**
 * Margem de contribuição por UNIDADE no preço atual, pela regra única (calcularMargem).
 * Comissão = percentual (observado no SKU, ou o configurado) × preço + tarifa fixa por
 * unidade (observada no SKU, ou a média da loja). Tarifa não medida fica de fora e a linha
 * diz isso. Sem acesso a valores (RLS esconde custos), devolve `bloqueado`.
 */
export function margemUnitaria(row, { custo, cfg, venda, podeVerValores, tarifaLoja = null }) {
  if (!podeVerValores) return { bloqueado: true }
  if (row.preco == null) return { mc: null, mcPct: null, faltando: ['preço do anúncio'], linhas: null }
  const taxaReal = taxaComissaoObservada(venda)
  const taxaCfg = cfg?.commission_pct == null || !Number.isFinite(Number(cfg.commission_pct)) ? null : Number(cfg.commission_pct) / 100
  const taxa = taxaReal ?? taxaCfg
  const fonte = taxaReal != null ? 'magalu' : taxaCfg != null ? 'percentual' : null
  const tarifaSku = tarifaFixaObservada(venda)
  const tarifa = tarifaSku ?? tarifaLoja
  const fonteTarifa = tarifaSku != null ? 'sku' : tarifaLoja != null ? 'loja' : null
  const comissaoPct = taxa == null ? null : row.preco * taxa
  const comissao = comissaoPct == null ? null : comissaoPct + (tarifa ?? 0)
  const r = calcularMargem(
    { receita: row.preco, unidades: 1, comissao, itensSemComissao: comissao == null ? 1 : 0 },
    custo, { ...cfg, commission_pct: null },
  )
  return {
    mc: r.mc,
    mcPct: r.mcPct,
    faltando: r.faltando,
    semFrete: r.semFrete,
    linhas: {
      comissao: { valor: comissaoPct, pct: taxa == null ? null : taxa * 100, fonte },
      tarifa: { valor: comissao == null ? null : tarifa, fonte: fonteTarifa },
      frete: { valor: r.componentes.frete, pct: cfg?.freight_pct ?? null },
      custo: { valor: r.componentes.custo },
      imposto: { valor: r.componentes.imposto, pct: cfg?.tax_pct ?? null },
    },
  }
}

/**
 * Junta catálogo, vendas 30d (Map sku → agregado de agregarPorSku), custos e config.
 * Família = SKUs com o mesmo group.id (variações do mesmo produto na Magalu).
 */
export function enriquecerSkus(rows, { vendas = new Map(), custos = new Map(), cfg = null, podeVerValores = false } = {}) {
  const porGrupo = new Map()
  for (const r of rows) if (r.grupoId) porGrupo.set(r.grupoId, (porGrupo.get(r.grupoId) ?? 0) + 1)
  const tarifaLoja = tarifaFixaDaLoja(vendas)
  return rows.map((r) => {
    const venda = vendas.get(r.sku) ?? null
    const custo = podeVerValores && custos.has(r.sku) ? custos.get(r.sku) : null
    return {
      ...r,
      // Sem venda no espelho dos 30 dias o vendido é zero real (os pedidos foram lidos inteiros).
      vendidos30: venda ? (venda.itensSemQtd > 0 && venda.unidades === 0 ? null : venda.unidades) : 0,
      custo,
      temCusto: custo != null,
      tamanhoFamilia: r.grupoId ? porGrupo.get(r.grupoId) : 1,
      margem: margemUnitaria(r, { custo, cfg, venda, podeVerValores, tarifaLoja }),
    }
  })
}

function passaSub(r, sub) {
  switch (sub) {
    case 'com_desconto': return r.descontoPct != null
    case 'vendeu': return (r.vendidos30 ?? 0) > 0
    // Estoque desconhecido não é estoque zero: fica fora dos dois filtros.
    case 'sem_estoque': return r.estoque === 0
    case 'estoque_baixo': return r.estoque != null && r.estoque > 0 && r.estoque <= ESTOQUE_BAIXO
    case 'full': return r.full === true
    case 'familia': return r.tamanhoFamilia > 1
    default: return true
  }
}

function passaAba(r, aba) {
  switch (aba) {
    case 'ativos': return r.ativo
    case 'com_custo': return r.temCusto
    case 'sem_custo': return !r.temCusto
    case 'nao_publicados': return r.naoPublicado
    default: return true
  }
}

export function contarAbas(rows) {
  return {
    todos: rows.length,
    ativos: rows.filter((r) => r.ativo).length,
    com_custo: rows.filter((r) => r.temCusto).length,
    sem_custo: rows.filter((r) => !r.temCusto).length,
    nao_publicados: rows.filter((r) => r.naoPublicado).length,
  }
}

/** Contagem de cada sub-filtro dentro da aba Ativos (como os chips do Gestor ML). */
export function contarSubfiltros(rows) {
  const ativos = rows.filter((r) => r.ativo)
  const out = {}
  for (const sub of ['todos', 'com_desconto', 'vendeu', 'sem_estoque', 'estoque_baixo', 'full', 'familia']) {
    out[sub] = ativos.filter((r) => passaSub(r, sub)).length
  }
  return out
}

export function filtrarSkus(rows, { aba = 'todos', sub = 'todos', busca = '' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (!passaAba(r, aba)) return false
    if (!passaSub(r, sub)) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q)
      || (r.titulo ?? '').toLowerCase().includes(q)
      || (r.marca ?? '').toLowerCase().includes(q)
  })
}

// Valor desconhecido vai sempre para o fim, nos dois sentidos.
function porNumero(valor, desc) {
  return (a, b) => {
    const va = valor(a); const vb = valor(b)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    return desc ? vb - va : va - vb
  }
}

export function ordenarSkus(rows, ordem = 'titulo') {
  const titulo = (a, b) => (a.titulo ?? a.sku).localeCompare(b.titulo ?? b.sku, 'pt-BR')
  const cmp = {
    maior_preco: porNumero((r) => r.preco, true),
    menor_preco: porNumero((r) => r.preco, false),
    mais_vendidos: porNumero((r) => r.vendidos30, true),
    menor_estoque: porNumero((r) => r.estoque, false),
    maior_margem: porNumero((r) => r.margem?.mcPct ?? null, true),
    menor_margem: porNumero((r) => r.margem?.mcPct ?? null, false),
  }[ordem]
  return [...rows].sort((a, b) => (cmp ? cmp(a, b) || titulo(a, b) : titulo(a, b)))
}

/**
 * Visão Famílias: agrupa por group.id. Família de 1 SKU fica solta. O "pai" é a variação
 * principal da Magalu; sem ela, a que mais vendeu.
 */
export function agruparFamilias(rows) {
  const grupos = new Map()
  const soltos = []
  for (const r of rows) {
    if (!r.grupoId || r.tamanhoFamilia <= 1) { soltos.push(r); continue }
    if (!grupos.has(r.grupoId)) grupos.set(r.grupoId, [])
    grupos.get(r.grupoId).push(r)
  }
  const familias = []
  for (const [id, membros] of grupos) {
    if (membros.length === 1) { soltos.push(membros[0]); continue }
    const pai = membros.find((m) => m.variacaoPrincipal)
      ?? [...membros].sort(porNumero((m) => m.vendidos30, true))[0]
    const precos = membros.map((m) => m.preco).filter((v) => v != null)
    const estoques = membros.map((m) => m.estoque)
    familias.push({
      id,
      pai,
      filhos: membros.filter((m) => m !== pai),
      membros,
      precoMin: precos.length ? Math.min(...precos) : null,
      precoMax: precos.length ? Math.max(...precos) : null,
      estoqueTotal: estoques.some((e) => e == null) ? null : estoques.reduce((s, e) => s + e, 0),
      estoqueDesconhecido: estoques.filter((e) => e == null).length,
      vendidos30: membros.reduce((s, m) => s + (m.vendidos30 ?? 0), 0),
    })
  }
  return { familias, soltos }
}

export function mapSkusResumo(rows) {
  const comEstoque = rows.filter((r) => r.estoque != null)
  const comPreco = rows.filter((r) => r.preco != null)
  return {
    total: rows.length,
    ativos: rows.filter((r) => r.ativo).length,
    semCusto: rows.filter((r) => !r.temCusto).length,
    semEstoque: rows.filter((r) => r.estoque === 0).length,
    estoqueDesconhecido: rows.length - comEstoque.length,
    estoqueTotal: comEstoque.length > 0 ? comEstoque.reduce((s, r) => s + r.estoque, 0) : null,
    precoMedio: comPreco.length > 0 ? comPreco.reduce((s, r) => s + r.preco, 0) / comPreco.length : null,
    vendidos30: rows.reduce((s, r) => s + (r.vendidos30 ?? 0), 0),
  }
}
