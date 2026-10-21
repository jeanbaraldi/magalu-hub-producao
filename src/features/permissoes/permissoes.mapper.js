// Decisões de acesso. PURO — sem React, sem fetch.

import {
  MODULOS_BLOQUEADOS, PAPEIS, PAPEIS_FINANCEIROS, VALOR_OCULTO,
} from './permissoes.constants'

/** Pode abrir este módulo? Papel desconhecido não abre nada. */
export function podeVerModulo(papel, moduloId) {
  if (!papel || !PAPEIS[papel]) return false
  return !(MODULOS_BLOQUEADOS[papel] ?? []).includes(moduloId)
}

/** Pode ver custo, margem, MC, lucro e valores de recebimento? */
export function podeVerFinanceiro(papel) {
  return PAPEIS_FINANCEIROS.includes(papel)
}

/**
 * Valor financeiro para exibição: devolve o próprio valor para quem pode ver e
 * um traço para quem não pode.
 *
 * ⚠️ Esconder na tela NÃO é proteção — o dado continua chegando ao navegador
 * enquanto as políticas do banco não filtrarem. Isto é apresentação; a trava
 * real é o RLS.
 */
export function valorFinanceiro(papel, valor) {
  return podeVerFinanceiro(papel) ? valor : VALOR_OCULTO
}

/**
 * Filtra os grupos da sidebar, removendo grupo que ficou sem nenhum item.
 *
 * Recebe a FUNÇÃO de decisão, não o papel: quem decide é a configuração salva
 * na tela de Acessos, e passar o papel amarraria este mapper à lista fixa.
 *
 * @param {Array} grupos
 * @param {(moduloId: string) => boolean} podeModulo
 */
export function filtrarNavegacao(grupos, podeModulo) {
  // Decisor ausente não libera nada: menu cheio por engano é pior que vazio.
  const decide = typeof podeModulo === 'function' ? podeModulo : () => false
  return (grupos ?? [])
    .map((g) => ({ ...g, items: (g.items ?? []).filter((i) => decide(i.id)) }))
    .filter((g) => g.items.length > 0)
}
