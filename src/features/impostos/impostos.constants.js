// Alíquotas sugeridas ao escolher o regime (mesma tabela do Gestor ML). Sempre editáveis.
export const REGIMES = [
  { value: 'mei', label: 'MEI', aliquota: 3 },
  { value: 'simples', label: 'Simples Nacional', aliquota: 8 },
  { value: 'presumido', label: 'Lucro Presumido', aliquota: 11.33 },
  { value: 'real', label: 'Lucro Real', aliquota: 11.33 },
  { value: 'manual', label: 'Alíquota manual', aliquota: null },
]

export const TEXTO_COMISSAO = 'A Magalu informa a comissão de cada item do pedido, e é ela que entra na margem. Este percentual só é usado nos itens em que a comissão não veio; deixe vazio se não quiser estimar.'
export const TEXTO_FRETE = 'Opcional. Estimativa do custo de envio que a loja assume, em % da venda. Vazio = não informado (a margem sai sem frete e avisa isso).'
export const MSG_SEM_ACESSO = 'Seu acesso não inclui a configuração financeira da loja. Peça a um admin ou financeiro.'
