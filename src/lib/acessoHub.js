// Suíte (banco unificado): o Hub decide quem entra em cada ferramenta.
// Resposta que não seja exatamente true/false vira "erro" — falha nunca libera.
export const SISTEMA_NO_HUB = 'magalu'

export async function verificarAcessoHub(cliente) {
  try {
    const { data, error } = await cliente.schema('hub').rpc('pode_acessar', { p_sistema: SISTEMA_NO_HUB })
    if (error) return 'erro'
    if (data === true) return 'liberado'
    if (data === false) return 'negado'
    return 'erro'
  } catch {
    return 'erro'
  }
}
