/**
 * Itens de um pedido da Magalu, lidos do payload cru.
 * Formato conferido na spec oficial (orders.openapi.yaml, 21/10/2026):
 * deliveries[].items[] com info.{sku,name}, quantity, unit_price {value, normalizer} e
 * amounts {total, normalizer, commission {total, normalizer}}. Entrega cancelada
 * (cancelamento parcial) não conta. Campo ausente vira null, nunca zero.
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

/**
 * Valor em reais: número, string numérica ou objeto da Magalu {value|amount|total, normalizer}.
 * Objeto sem normalizer é ilegível (null): a doc manda não presumir 100.
 */
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
    return Number.isFinite(norm) && norm > 0 ? bruto / norm : null
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

const entregaCancelada = (d) => String(d?.status ?? '').toLowerCase() === 'cancelled'

function listaDeItens(payload) {
  const entregas = pegar(payload, ['deliveries'])
  if (Array.isArray(entregas)) {
    return entregas.filter((d) => ehObj(d) && !entregaCancelada(d)).flatMap((d) => (Array.isArray(d.items) ? d.items : []))
  }
  const direto = pegar(payload, ['items'])
  return Array.isArray(direto) ? direto : []
}

/**
 * Tarifa fixa por unidade que a Magalu cobra além da comissão percentual.
 * Medido em 22/10/2026: amounts.commission do PEDIDO = soma da comissão dos itens +
 * R$ 5,00 ou R$ 5,50 por unidade (sempre o mesmo valor por SKU). Os itens não trazem essa
 * parte, então ela sai da diferença, rateada por unidade.
 * Devolve null (desconhecida) quando não dá para separar: sem comissão no pedido, alguma
 * entrega cancelada (não se sabe se o pedido ainda a cobra), item sem comissão ou sem
 * quantidade, ou diferença negativa.
 */
function tarifaFixaPorUnidade(payload, itens) {
  const doPedido = dinheiro(pegar(payload, ['amounts.commission']))
  if (doPedido == null || itens.length === 0) return null
  const entregas = pegar(payload, ['deliveries'])
  if (Array.isArray(entregas) && entregas.some(entregaCancelada)) return null
  let somaItens = 0
  let unidades = 0
  for (const it of itens) {
    if (it.comissao == null || it.quantidade == null) return null
    somaItens += it.comissao
    unidades += it.quantidade
  }
  if (unidades <= 0) return null
  const diferenca = Math.round((doPedido - somaItens) * 100) / 100
  return diferenca < 0 ? null : diferenca / unidades
}

/**
 * Itens normalizados: { sku, titulo, quantidade, precoUnitario, total, comissao, tarifaFixa }.
 * `total` = preço unitário × quantidade (o que o comprador pagou pelo produto); sem os dois,
 * cai para amounts do item. `comissao` = comissão percentual informada no item;
 * `tarifaFixa` = tarifa fixa por unidade × quantidade (null quando não dá para separar).
 */
export function itensDoPedido(payload) {
  const itens = itensSemTarifa(payload)
  const porUnidade = tarifaFixaPorUnidade(payload, itens)
  return itens.map((it) => ({
    ...it,
    tarifaFixa: porUnidade == null || it.quantidade == null ? null : porUnidade * it.quantidade,
  }))
}

function itensSemTarifa(payload) {
  return listaDeItens(payload).filter(ehObj).map((it) => {
    const sku = texto(pegar(it, ['info.sku']))
    const titulo = texto(pegar(it, ['info.name']))
    const quantidade = numero(pegar(it, ['quantity']))
    const precoUnitario = dinheiro(pegar(it, ['unit_price']))
    let total = precoUnitario != null && quantidade != null ? precoUnitario * quantidade : null
    if (total == null) total = dinheiro(pegar(it, ['amounts']))
    const comissao = dinheiro(pegar(it, ['amounts.commission']))
    return { sku, titulo, quantidade, precoUnitario, total, comissao }
  })
}

/**
 * Agrega pedidos por SKU. Só pedidos que contam como venda entram.
 * Por SKU: { sku, titulo, unidades, receita, comissao, tarifaFixa, unidadesComTarifa,
 * itensSemComissao, itensSemValor, itensSemQtd, pedidos }.
 * `comissao` = percentual + tarifa fixa (o total que a Magalu cobra). Item sem a tarifa
 * conhecida conta em `itensSemComissao`: comissão pela metade não é comissão.
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
        a = { sku: it.sku, titulo: it.titulo, unidades: 0, receita: 0, comissao: 0, tarifaFixa: 0, unidadesComTarifa: 0, itensSemComissao: 0, itensSemValor: 0, itensSemQtd: 0, pedidos: new Set() }
        mapa.set(it.sku, a)
      }
      if (!a.titulo && it.titulo) a.titulo = it.titulo
      if (it.quantidade == null) a.itensSemQtd++
      else a.unidades += it.quantidade
      if (it.total == null) a.itensSemValor++
      else a.receita += it.total
      if (it.comissao == null || it.tarifaFixa == null) a.itensSemComissao++
      else {
        a.comissao += it.comissao + it.tarifaFixa
        a.tarifaFixa += it.tarifaFixa
        a.unidadesComTarifa += it.quantidade
      }
      a.pedidos.add(String(p.order_id ?? p.id ?? ''))
    }
  }
  const linhas = [...mapa.values()].map((a) => ({ ...a, pedidos: a.pedidos.size }))
  return { linhas, semSku }
}
