import { describe, it, expect } from 'vitest'
import { buildDiagnostico, deslocarDia, filtrarDiagnostico, ordenarDiagnostico, resumoDiagnostico, vendasPorDia, FILTROS_VAZIOS } from './diagnostico.mapper'

const HOJE = '2026-10-29'
const FIM = '2026-10-28'
const dia = (k) => deslocarDia(FIM, -k)

/** Pedido aprovado com um item, às 15h de Brasília do dia k. */
const pedido = (sku, k, qtd = 1) => ({
  status: 'approved',
  purchased_at: `${dia(k)}T18:00:00Z`,
  payload: { deliveries: [{ status: 'approved', items: [{ info: { sku }, quantity: qtd, unit_price: { value: 1000, normalizer: 100 } }] }] },
})
const linha = (over = {}) => ({
  sku: 'A1', titulo: 'Calha', imagem: null, ativo: true, pausado: false, statusInfo: { label: 'Publicado' },
  estoque: 50, vendas30: 0, receita30: 0, margem30: null, curva: 'C', ...over,
})
const run = (catalogo, pedidos, desde = dia(89)) => buildDiagnostico(catalogo, vendasPorDia(pedidos), HOJE, desde)

describe('vendasPorDia', () => {
  it('soma por dia de Brasília e ignora pedido que não é venda', () => {
    const v = vendasPorDia([pedido('A1', 0, 2), pedido('A1', 0), { ...pedido('A1', 1), status: 'cancelled' }])
    expect(v.porSku.get('A1').get(FIM)).toBe(3)
    expect(v.porSku.get('A1').has(dia(1))).toBe(false)
    expect(v.ultima.get('A1')).toBe(FIM)
  })
})

describe('sinais', () => {
  const todoDia = (sku, n, ateK = 59, qtd = 1) => Array.from({ length: ateK + 1 }, (_, k) => pedido(sku, k, qtd)).slice(0, n)
  it('sem estoque com demanda e ruptura iminente (crítica na curva A)', () => {
    const rows = run([linha({ estoque: 0 }), linha({ sku: 'B2', estoque: 3, curva: 'A' })],
      [...todoDia('A1', 30), ...todoDia('B2', 30)])
    expect(rows.find((r) => r.sku === 'A1').sinais).toContain('P02_SEM_ESTOQUE_COM_DEMANDA')
    const b = rows.find((r) => r.sku === 'B2')
    expect(b.sinais).toContain('S03_RUPTURA_IMINENTE')
    expect(b.severidadeMax).toBe('critica')
  })
  it('queda geral só com 5 semanas de histórico', () => {
    const pedidos = Array.from({ length: 60 }, (_, k) => (k < 7 ? null : pedido('A1', k, 2))).filter(Boolean)
    expect(run([linha()], pedidos)[0].sinais).toContain('Q03_QUEDA_GERAL')
    expect(run([linha()], pedidos, dia(20))).toHaveLength(0)
  })
  it('zumbi conta desde o início dos pedidos gravados, e precisa de 45 dias', () => {
    expect(run([linha()], [], dia(20))).toHaveLength(0)
    const r = run([linha()], [], dia(50))[0]
    expect(r.sinais).toEqual(['E01_ZUMBI'])
    expect(r.evidencias[0].texto).toContain('início dos pedidos gravados, 50 dias')
  })
  it('margem abaixo do piso e margem alta com volume baixo', () => {
    const rows = run([linha({ vendas30: 10, margem30: 5 }), linha({ sku: 'B2', vendas30: 1, margem30: 40 }), linha({ sku: 'C3', vendas30: 20, margem30: 15 })], [...todoDia('A1', 10), ...todoDia('B2', 1), ...todoDia('C3', 20)])
    expect(rows.find((r) => r.sku === 'A1').sinais).toContain('P01_MARGEM_ABAIXO_PISO')
    expect(rows.find((r) => r.sku === 'B2').sinais).toContain('S04_MARGEM_ALTA_VOLUME_BAIXO')
  })
})

describe('resumo, filtro e ordem', () => {
  const rows = run([linha({ estoque: 0, faturamento30: 1 }), linha({ sku: 'B2' })],
    Array.from({ length: 30 }, (_, k) => pedido('A1', k)), dia(50))
  it('conta por família e filtra', () => {
    expect(resumoDiagnostico(rows)).toEqual({ porFamilia: { escala: 0, problema: 1, queda: 0, estagnado: 1 }, criticos: 1 })
    expect(filtrarDiagnostico(rows, { ...FILTROS_VAZIOS, familia: 'estagnado' }).map((r) => r.sku)).toEqual(['B2'])
    expect(ordenarDiagnostico(rows, null, 'desc')[0].sku).toBe('A1')
  })
})
