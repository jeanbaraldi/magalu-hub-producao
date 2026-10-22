// Endereços e escopos da API da Magalu (Magalu Open API, ID Magalu).
//
// Conferido na doc oficial (developers.magalu.com, 21/10/2026): login em id.magalu.com/login
// com choose_tenants=true; o `scope` pedido SOMA aos --scopes-default do client criado no IDM.
// Escopo que o client não tem habilitado faz o consentimento falhar. Troca sem deploy de
// código por VITE_MAGALU_SCOPES.

export const MAGALU_AUTH_URL = 'https://id.magalu.com/login'

export const MAGALU_ESCOPOS_PADRAO = [
  'open:portfolio-skus-seller:read',
  'open:portfolio-prices-seller:read',
  'open:portfolio-stocks-seller:read',
  'open:order-order-seller:read',
  // Análise Financeira (frete, tarifa fixa, MDR por pedido). AVAILABLE no client desde
  // 22/10/2026, pedido só aqui (não é --scopes-default): loja que reconectar passa a ter.
  'open:order-financial-report-seller:read',
].join(' ')
