// Endereços e escopos da API da Magalu (Magalu Open API, ID Magalu).
//
// ⚠️ NÃO VALIDADO contra a documentação oficial: developers.magalu.com estava
// bloqueado pela rede do ambiente quando este arquivo foi escrito. O fluxo
// (id.magalu.com/login com choose_tenants=true, troca em id.magalu.com/oauth/token)
// veio do índice público da documentação. Os ESCOPOS são a parte mais incerta:
// conferir na doc e, se precisar, trocar por VITE_MAGALU_SCOPES sem mexer aqui.

export const MAGALU_AUTH_URL = 'https://id.magalu.com/login'

export const MAGALU_ESCOPOS_PADRAO = [
  'openid',
  'open:portfolio:read',
  'open:order-order:read',
].join(' ')
