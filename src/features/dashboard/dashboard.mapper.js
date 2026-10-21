import { pedidoContaComoVenda, pedidoCancelado, diaBrt, somarReceita } from '../magalu/vendas'

/** Lista de dias BRT do período, do mais antigo ao mais novo (inclui hoje). */
export function diasDoPeriodo(dias, agora = new Date()) {
  const hoje = diaBrt(agora.toISOString())
  const [a, m, d] = hoje.split('-').map(Number)
  const out = []
  for (let i = dias - 1; i >= 0; i--) {
    out.push(new Date(Date.UTC(a, m - 1, d - i)).toISOString().slice(0, 10))
  }
  return out
}

/**
 * Série diária de receita e pedidos (só vendas). Dia sem pedido vale 0 de verdade
 * (o espelho foi lido inteiro); dia cujos pedidos têm todos valor ilegível vira null.
 */
export function mapSerieDiaria(pedidos, dias, agora = new Date()) {
  const porDia = new Map(diasDoPeriodo(dias, agora).map((d) => [d, []]))
  for (const p of pedidos) {
    if (!pedidoContaComoVenda(p.status)) continue
    const d = diaBrt(p.purchased_at)
    if (porDia.has(d)) porDia.get(d).push(p)
  }
  return [...porDia.entries()].map(([dia, lista]) => {
    const r = somarReceita(lista)
    return {
      dia,
      rotulo: `${dia.slice(8, 10)}/${dia.slice(5, 7)}`,
      pedidos: lista.length,
      receita: lista.length === 0 ? 0 : r.total,
    }
  })
}

export function mapDashboard({ pedidos, skus, dias, agora = new Date() }) {
  const vendas = pedidos.filter((p) => pedidoContaComoVenda(p.status))
  const receita = somarReceita(vendas)
  const hoje = diaBrt(agora.toISOString())
  const vendasHoje = vendas.filter((p) => diaBrt(p.purchased_at) === hoje)
  const receitaHoje = somarReceita(vendasHoje)
  return {
    kpis: {
      receita: receita.total,
      semValor: receita.semValor,
      pedidos: vendas.length,
      ticket: receita.total != null ? receita.total / receita.conhecidos : null,
      cancelados: pedidos.filter((p) => pedidoCancelado(p.status)).length,
      hojeReceita: vendasHoje.length === 0 ? 0 : receitaHoje.total,
      hojePedidos: vendasHoje.length,
      skusAtivos: skus.filter((s) => ['active', 'ativo', 'published'].includes(String(s.status ?? '').toLowerCase())).length,
      skusSemEstoque: skus.filter((s) => s.stock === 0).length,
      skusTotal: skus.length,
    },
    serie: mapSerieDiaria(pedidos, dias, agora),
  }
}
