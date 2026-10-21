import { STATUS_SKU, ESTOQUE_BAIXO } from './anuncios.constants'

const ATIVOS = new Set(['active', 'ativo', 'published'])

export function statusSku(status) {
  if (!status) return { label: 'Sem status', tone: 'slate' }
  const s = String(status).toLowerCase()
  return STATUS_SKU[s] ?? { label: String(status).replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), tone: 'slate' }
}

export function mapSkuRow(r) {
  const preco = r.price == null ? null : Number(r.price)
  const lista = r.list_price == null ? null : Number(r.list_price)
  return {
    sku: String(r.sku),
    titulo: r.title,
    status: r.status,
    statusInfo: statusSku(r.status),
    ativo: ATIVOS.has(String(r.status ?? '').toLowerCase()),
    preco,
    precoLista: lista,
    // Desconto só existe com os dois preços conhecidos e o de lista maior.
    descontoPct: preco != null && lista != null && lista > preco ? (1 - preco / lista) * 100 : null,
    estoque: r.stock == null ? null : Number(r.stock),
    imagem: r.image_url,
    sincronizadoEm: r.synced_at,
  }
}

export function filtrarSkus(rows, { filtro = 'todos', busca = '' } = {}) {
  const q = busca.trim().toLowerCase()
  return rows.filter((r) => {
    if (filtro === 'ativos' && !r.ativo) return false
    if (filtro === 'inativos' && r.ativo) return false
    // Estoque desconhecido não é estoque zero: fica fora dos dois filtros.
    if (filtro === 'sem_estoque' && r.estoque !== 0) return false
    if (filtro === 'estoque_baixo' && !(r.estoque != null && r.estoque > 0 && r.estoque <= ESTOQUE_BAIXO)) return false
    if (!q) return true
    return r.sku.toLowerCase().includes(q) || (r.titulo ?? '').toLowerCase().includes(q)
  })
}

export function mapSkusResumo(rows) {
  const comEstoque = rows.filter((r) => r.estoque != null)
  return {
    total: rows.length,
    ativos: rows.filter((r) => r.ativo).length,
    semEstoque: rows.filter((r) => r.estoque === 0).length,
    estoqueDesconhecido: rows.length - comEstoque.length,
    estoqueTotal: comEstoque.length > 0 ? comEstoque.reduce((s, r) => s + r.estoque, 0) : null,
  }
}
