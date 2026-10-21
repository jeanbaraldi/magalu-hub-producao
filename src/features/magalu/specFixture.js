/**
 * Só para testes: monta o payload de pedido no formato da spec oficial a partir de itens
 * simples { sku, name, quantity, total (R$), commission (R$) }.
 */
export function payloadSpec(itens = []) {
  return {
    deliveries: [{
      status: 'approved',
      items: itens.map((i) => ({
        info: { sku: i.sku, name: i.name ?? i.title },
        quantity: i.quantity,
        amounts: {
          total: i.total == null ? undefined : Math.round(i.total * 100),
          normalizer: 100,
          commission: i.commission == null ? undefined : { total: Math.round(i.commission * 100), normalizer: 100 },
        },
      })),
    }],
  }
}
