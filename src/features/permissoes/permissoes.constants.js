// Papéis de acesso do Gestor Magalu (mesma regra do Gestor ML).
// Escopo só deste gestor; sem restrição por conta vendedora.

export const PAPEIS = {
  admin: {
    label: 'Admin',
    descricao: 'Vê e faz tudo, incluindo configurações e chaves.',
    tone: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  financeiro: {
    label: 'Financeiro',
    descricao: 'Vê dinheiro: custo, margem, recebíveis e pedidos. Não mexe em configurações.',
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  colaborador: {
    label: 'Colaborador',
    descricao: 'Opera anúncios, perguntas, tarefas e promoções. Não vê custo nem margem.',
    tone: 'text-slate-700 bg-slate-100 border-slate-200',
  },
}
export const PAPEL_KEYS = Object.keys(PAPEIS)
export const PAPEL_PADRAO = 'colaborador'

/**
 * Módulos que cada papel NÃO acessa (por id do item da sidebar / rota).
 *
 * Lista de BLOQUEIO, não de liberação: página nova nasce visível para quem já
 * entra. Numa lista de liberação, cada tela criada apareceria só para o admin
 * até alguém lembrar de cadastrá-la — e ninguém lembra.
 */
export const MODULOS_BLOQUEADOS = {
  admin: [],
  // Configurações guarda a conexão OAuth da Magalu: só admin.
  financeiro: ['configuracoes'],
  // Mesma régua do Gestor ML: pedidos mostram valor por transação.
  colaborador: ['configuracoes', 'pedidos'],
}

/** Quem enxerga custo, margem, MC, lucro e valores de recebimento. */
export const PAPEIS_FINANCEIROS = ['admin', 'financeiro']

/** O que aparece no lugar de um número que a pessoa não pode ver. */
export const VALOR_OCULTO = '—'
