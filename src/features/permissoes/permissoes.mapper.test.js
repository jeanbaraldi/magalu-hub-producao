import { describe, test, expect } from 'vitest'
import { podeVerModulo, podeVerFinanceiro, valorFinanceiro, filtrarNavegacao } from './permissoes.mapper'

describe('podeVerModulo', () => {
  test('colaborador não abre as telas de dinheiro', () => {
    for (const m of ['pedidos']) {
      expect(podeVerModulo('colaborador', m), m).toBe(false)
    }
  })

  test('colaborador abre o dashboard e os anúncios', () => {
    for (const m of ['dashboard', 'anuncios']) {
      expect(podeVerModulo('colaborador', m), m).toBe(true)
    }
  })

  test('configurações é só do admin — guarda OAuth e chaves', () => {
    expect(podeVerModulo('admin', 'configuracoes')).toBe(true)
    expect(podeVerModulo('financeiro', 'configuracoes')).toBe(false)
    expect(podeVerModulo('colaborador', 'configuracoes')).toBe(false)
  })

  test('papel desconhecido não abre NADA', () => {
    expect(podeVerModulo(null, 'anuncios')).toBe(false)
    expect(podeVerModulo('inventado', 'anuncios')).toBe(false)
  })

  test('módulo novo nasce visível para quem já entra — a lista é de bloqueio', () => {
    expect(podeVerModulo('colaborador', 'modulo_que_ainda_nao_existe')).toBe(true)
  })
})

describe('podeVerFinanceiro e valorFinanceiro', () => {
  test('admin e financeiro veem número; colaborador vê traço', () => {
    expect(podeVerFinanceiro('admin')).toBe(true)
    expect(podeVerFinanceiro('financeiro')).toBe(true)
    expect(podeVerFinanceiro('colaborador')).toBe(false)
    expect(valorFinanceiro('financeiro', 1234.5)).toBe(1234.5)
    expect(valorFinanceiro('colaborador', 1234.5)).toBe('—')
  })

  test('zero é um valor, não ausência: quem pode ver, vê o zero', () => {
    expect(valorFinanceiro('admin', 0)).toBe(0)
  })

  test('papel desconhecido não vê financeiro', () => {
    expect(podeVerFinanceiro(null)).toBe(false)
  })
})

describe('filtrarNavegacao', () => {
  const GRUPOS = [
    { id: 'principal', items: [{ id: 'dashboard' }, { id: 'tarefas' }] },
    { id: 'gestao', items: [{ id: 'pedidos' }, { id: 'configuracoes' }] },
    { id: 'operacao', items: [{ id: 'perguntas' }] },
  ]

  // A decisão agora vem de fora (configuração salva), não do papel.
  const comoColaborador = (id) => podeVerModulo('colaborador', id)

  test('grupo que ficou sem item some, em vez de virar cabeçalho vazio', () => {
    const vis = filtrarNavegacao(GRUPOS, comoColaborador)
    expect(vis.map((g) => g.id)).toEqual(['principal', 'operacao'])
  })

  test('admin vê a navegação inteira', () => {
    expect(filtrarNavegacao(GRUPOS, () => true)).toHaveLength(3)
  })

  test('sem decisor não mostra menu nenhum — menu cheio por engano é pior', () => {
    expect(filtrarNavegacao(GRUPOS, null)).toEqual([])
    expect(filtrarNavegacao(GRUPOS, undefined)).toEqual([])
  })

  test('esconder um módulo tira só ele, preservando os irmãos do grupo', () => {
    const semTarefas = (id) => id !== 'tarefas'
    const vis = filtrarNavegacao(GRUPOS, semTarefas)
    expect(vis.find((g) => g.id === 'principal').items.map((i) => i.id)).toEqual(['dashboard'])
  })
})
