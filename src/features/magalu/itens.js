/**
 * Itens de um pedido da Magalu, lidos do payload cru com caminhos tolerantes.
 *
 * ⚠️ NÃO VALIDADO contra a spec oficial (orders.openapi.yaml). Quando nenhum caminho
 * bate, o campo vira null — nunca zero. Corrigir o mapeamento aqui não exige buscar de
 * novo na Magalu: o pedido cru fica em `orders.payload`.
 */
import { pedidoContaComoVenda } from './vendas'

const ehObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

function pegar(o, caminhos) {
  for (const c of caminhos) {
    let atual = o
    for (const parte of c.split('.')) {
      if (Array.isArray(atual) && /^\d+$/.test(parte)) { atual = atual[Number(parte)]; continue }
      if (!ehObj(atual)) { atual = undefined; break }
      atual = atual[parte]
    }
    if (atual !== undefined && atual !== null && atual !== '') return atual
  }
  return undefined
}

/** Valor em reais: número, string numérica ou {value|amount, normalizer}. */
export function dinheiro(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  if (ehObj(v)) {
    const bruto = dinheiro(v.value ?? v.amount ?? v.total)
    if (bruto === null) return null
    const norm = Number(v.normalizer)
    return Number.isFinite(norm) && norm > 0 ? bruto / norm : bruto
  }
  return null
}

function numero(v) {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function texto(v) {
  const s = typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''
  return s || null
}

function listaDeItens(payload) {
  const direto = pegar(payload, ['items', 'order_items', 'products'])
  if (Array.isArray(direto)) return direto
  const entregas = pegar(payload, ['deliveries'])
  if (Array.isArray(entregas)) return entregas.flatMap((d) => (Array.isArray(d?.items) ? d.items : []))
  return []
}

/**
 * Itens normalizados: { sku, titulo, quantidade, precoUnitario, total }.
 * `total` = valor explícito do item, ou preço unitário × quantidade quando os dois existem.
 */
export function itensDoPedido(payload) {
  return listaDeItens(payload).filter(ehObj).map((it) => {
    const sku = texto(pegar(it, ['info.sku', 'info.id', 'sku.code', 'sku.id', 'sku', 'product.sku', 'product.id', 'seller_sku', 'code', 'id']))
    const titulo = texto(pegar(it, ['info.name', 'info.title', 'product.name', 'product.title', 'sku.name', 'name', 'title']))
    const quantidade = numero(pegar(it, ['quantity', 'qty', 'amount_items', 'units']))
    const precoUnitario = dinheiro(pegar(it, ['unit_price', 'price', 'prices.unit', 'info.price', 'sale_price']))
    let total = dinheiro(pegar(it, ['total', 'total_price', 'prices.total', 'amounts.total', 'subtotal']))
    if (total == null && precoUnitario != null && quantidade != null) total = precoUnitario * quantidade
    return { sku, titulo, quantidade, precoUnitario, total }
  })
}

/**
 * Agrega pedidos por SKU. Só pedidos que contam como venda entram.
 * Por SKU: { sku, titulo, unidades, receita, itensSemValor, itensSemQtd, pedidos }.
 * `receita` soma só o que é conhecido; `itensSemValor` diz quantos ficaram de fora.
 * Item sem SKU entra em `semSku` (contagem), nunca some em silêncio.
 */
export function agregarPorSku(pedidos) {
  const mapa = new Map()
  let semSku = 0
  for (const p of pedidos) {
    if (!pedidoContaComoVenda(p.status)) continue
    for (const it of itensDoPedido(p.payload)) {
      if (!it.sku) { semSku++; continue }
      let a = mapa.get(it.sku)
      if (!a) {
        a = { sku: it.sku, titulo: it.titulo, unidades: 0, receita: 0, itensSemValor: 0, itensSemQtd: 0, pedidos: new Set() }
        mapa.set(it.sku, a)
      }
      if (!a.titulo && it.titulo) a.titulo = it.titulo
      if (it.quantidade == null) a.itensSemQtd++
      else a.unidades += it.quantidade
      if (it.total == null) a.itensSemValor++
      else a.receita += it.total
      a.pedidos.add(String(p.order_id ?? p.id ?? ''))
    }
  }
  const linhas = [...mapa.values()].map((a) => ({ ...a, pedidos: a.pedidos.size }))
  return { linhas, semSku }
}
