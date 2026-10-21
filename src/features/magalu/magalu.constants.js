// Endereços e escopos da API da Magalu (Magalu Open API, ID Magalu).
//
// Conferido em 21/10/2026 pelo conteúdo indexado de developers.magalu.com (o site
// estava bloqueado na rede do ambiente; leitura direta da página ainda pendente):
// - login em id.magalu.com/login, choose_tenants=true para seller, code vale 10 min;
// - escopos granulares por recurso, um de leitura para cada (Produtos e Pedidos).
// O `scope` pedido SOMA aos escopos padrão do app: o app precisa ter cada um deles
// habilitado no ID Magalu, senão o consentimento falha. Troca sem deploy de código
// por VITE_MAGALU_SCOPES.

export const MAGALU_AUTH_URL = 'https://id.magalu.com/login'

export const MAGALU_ESCOPOS_PADRAO = [
  'openid',
  'open:portfolio-skus-seller:read',
  'open:portfolio-prices-seller:read',
  'open:portfolio-stocks-seller:read',
  'open:order-order-seller:read',
].join(' ')
