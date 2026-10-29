// Endereços e escopos da API da Magalu (Magalu Open API, ID Magalu).
//
// Conferido na doc oficial (developers.magalu.com, 21/10/2026): login em id.magalu.com/login
// com choose_tenants=true; o `scope` pedido SOMA aos --scopes-default do client criado no IDM.
// Escopo que o client não tem habilitado faz o consentimento falhar. Troca sem deploy de
// código por VITE_MAGALU_SCOPES.

export const MAGALU_AUTH_URL = 'https://id.magalu.com/login'

// Todos AVAILABLE no client (idm client list, 22/10/2026). Só leitura. Escopo que o client
// não tem faz o consentimento falhar: confira no `idm client list` antes de acrescentar.
// Magalu Ads NÃO existe no catálogo do IDM (idm scope list): pedir os de Ads derruba o login.
export const MAGALU_ESCOPOS_PADRAO = [
  // Catálogo, preço, estoque e pedidos (base da v1)
  'open:portfolio-skus-seller:read',
  'open:portfolio-prices-seller:read',
  'open:portfolio-stocks-seller:read',
  'open:order-order-seller:read',
  // Análise Financeira: frete, tarifa fixa e MDR por pedido
  'open:order-financial-report-seller:read',
  // Entregas, nota fiscal e rastreio
  'open:order-delivery-seller:read',
  'open:order-invoice-seller:read',
  'open:logistic-seller-trackings:read',
  // SAC: reclamações, devoluções e mensagens
  'open:tickets-seller:read',
  'open:ticket-messages-seller:read',
  'open:ticket-returns-seller:read',
  'open:ticket-events-seller:read',
  'open:sac-transaction-seller:read',
  // Perguntas e conversas (services.magalu.com)
  'services:questions-seller:read',
  'services:conversations-seller:read',
  // Promoções
  'open:promotion-promotions-seller:read',
  'open:promotion-skus-seller:read',
  'open:promotion-subscriptions-seller:read',
  // Fulfillment, CDs, categorias e nota de qualidade
  'open:fulfillment-shippings-seller:read',
  'open:logistic-stock-scheduling-seller:read',
  'open:seller-logistics-warehouses:read',
  'open:portfolio-categories-seller:read',
  'open:portfolio-scores-seller:read',
].join(' ')
