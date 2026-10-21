/**
 * Produtos: catálogo (magalu.skus) + custo cadastrado (magalu.sku_costs) + vendas de 30 dias.
 * Regras: custo não cadastrado não é custo zero; preço ausente deixa markup/margem nulos;
 * SKU sem pedido no período vendeu 0 de verdade, mas item sem quantidade deixa a soma PARCIAL.
 */

const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

/** Converte texto digitado ("12,50", "R$ 12.5") em número >= 0, `null` para vazio, `NaN` para inválido. */
export function parseCusto(texto) {
  const s = String(texto ?? '').replace(/r\$/i, '').trim()
  if (s === '') return null
  // "1.234,56" → 1234.56 ; "12,5" → 12.5 ; "12.5" → 12.5
  const normal = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  if (!/^\d+(\.\d+)?$/.test(normal)) return Number.NaN
  return Number(normal)
}

/**
 * @param {Array<object>} skus linhas cruas de magalu.skus
 * @param {Map<string, number>} custos
 * @param {{ linhas: Array<object> }|null} vendas resultado de agregarPorSku (null = vendas indisponíveis)
 * @param {{ podeVerValores: boolean }} opts
 */
export function mapProdutos(skus, custos, vendas, { podeVerValores = false } = {}) {
  const porSku = new Map((vendas?.linhas ?? []).map((l) => [l.sku, l]))
  return skus.map((r) => {
    const sku = String(r.sku)
    const preco = num(r.price)
    const custo = podeVerValores && custos.has(sku) ? num(custos.get(sku)) : null
    const v = porSku.get(sku)
    const temPrecoECusto = preco != null && custo != null
    return {
      sku,
      titulo: r.title ?? null,
      imagem: r.image_url ?? null,
      preco,
      custo,
      temCusto: podeVerValores && custos.has(sku),
      markup: temPrecoECusto && custo > 0 ? preco / custo : null,
      margemUnit: temPrecoECusto ? preco - custo : null,
      margemPct: temPrecoECusto && preco > 0 ? ((preco - custo) / preco) * 100 : null,
      // vendas null = pedidos não carregaram; 0 = leu e não vendeu
      vendas30: vendas == null ? null : (v ? v.unidades : 0),
      vendasParcial: !!v && v.itensSemQtd > 0,
    }
  })
}

export function filtrarProdutos(rows, { filtro = 'todos', busca = '' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (filtro === 'sem_custo' && r.temCusto) return false
    if (filtro === 'com_custo' && !r.temCusto) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q) || (r.titulo ?? '').toLowerCase().includes(q)
  })
}

export function resumoCustos(rows) {
  return { total: rows.length, comCusto: rows.filter((r) => r.temCusto).length }
}

/**
 * Lê o texto da importação "SKU;custo" (uma linha por SKU).
 * Devolve { validas:[{sku,custo,linha}], foraDoCatalogo:[...], invalidas:[{linha,texto,motivo}] }.
 * SKU repetido: vale a última linha e as anteriores viram inválidas (nunca grava duas vezes).
 */
export function parseImportacao(texto, skusCatalogo) {
  const catalogo = skusCatalogo instanceof Set ? skusCatalogo : new Set(skusCatalogo)
  const porSku = new Map()
  const invalidas = []
  String(texto ?? '').split(/\r?\n/).forEach((bruta, i) => {
    const linha = i + 1
    const t = bruta.trim()
    if (!t) return
    const partes = t.split(/[;\t]/)
    if (partes.length !== 2) { invalidas.push({ linha, texto: t, motivo: 'use o formato SKU;custo' }); return }
    const sku = partes[0].trim()
    if (!sku) { invalidas.push({ linha, texto: t, motivo: 'SKU vazio' }); return }
    const custo = parseCusto(partes[1])
    if (custo == null) { invalidas.push({ linha, texto: t, motivo: 'custo vazio' }); return }
    if (Number.isNaN(custo)) { invalidas.push({ linha, texto: t, motivo: 'custo inválido' }); return }
    const anterior = porSku.get(sku)
    if (anterior) invalidas.push({ linha: anterior.linha, texto: `${sku};${anterior.custo}`, motivo: `SKU repetido (vale a linha ${linha})` })
    porSku.set(sku, { sku, custo, linha })
  })
  const todas = [...porSku.values()].sort((a, b) => a.linha - b.linha)
  return {
    validas: todas.filter((x) => catalogo.has(x.sku)),
    foraDoCatalogo: todas.filter((x) => !catalogo.has(x.sku)),
    invalidas: invalidas.sort((a, b) => a.linha - b.linha),
  }
}
