/**
 * Previsões — mapper PURO (sem React, sem fetch). `agora` é injetado.
 *
 * Método, simples e declarado na tela:
 * 1. Base: unidades vendidas por dia nos 90 dias FECHADOS de Brasília (termina ontem).
 *    Dia sem venda é ZERO real (o espelho foi lido inteiro). Item sem quantidade legível
 *    é DESCONHECIDO: não soma, e a tela diz quantos foram.
 * 2. Sazonalidade: índice por dia da semana = média do dia ÷ média geral, encolhido rumo a 1.
 * 3. Nível: média diária dessazonalizada, ponderada por recência (meia-vida de 21 dias).
 * 4. Projeção diária = nível × índice do dia da semana. Faixa por desvio padrão dos resíduos
 *    dos últimos 28 dias (z = 1,28): conservador / provável / agressivo.
 * 5. Acurácia: backtest — projeta os últimos 14 dias da base usando só os 76 anteriores e
 *    mede o MAPE nos dias com venda. Sem base suficiente, null.
 * Ruptura de estoque NÃO é corrigida: dia sem estoque parece dia sem demanda.
 */
import { pedidoContaComoVenda, diaBrt } from '../magalu/vendas'
import { itensDoPedido } from '../magalu/itens'
import { listaDias, diaDaSemana } from '../relatorios/relatorios.mapper'
import { variacao } from '../vendas/vendas.mapper'
import { MEIA_VIDA, JANELA_DISPERSAO, DIAS_BACKTEST, MIN_DIAS_MAPE, Z_FAIXA, ENCOLHIMENTO_SEMANA, DIAS_BASE } from './previsoes.constants'

const rotulo = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`

/** Próximos `n` dias BRT a partir de hoje (inclui hoje). */
export function diasFuturos(n, agora = new Date()) {
  const [a, m, d] = diaBrt(agora.toISOString()).split('-').map(Number)
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(a, m - 1, d + i)).toISOString().slice(0, 10))
}

/** Índices de dia da semana (0 = domingo), encolhidos rumo a 1. Média geral 0 → todos 1. */
export function indicesSemana(serie, dias) {
  const n = serie.length
  const media = n > 0 ? serie.reduce((s, v) => s + v, 0) / n : 0
  if (media <= 0) return Array(7).fill(1)
  const soma = Array(7).fill(0)
  const cont = Array(7).fill(0)
  serie.forEach((v, i) => { const w = diaDaSemana(dias[i]); soma[w] += v; cont[w]++ })
  const k = ENCOLHIMENTO_SEMANA
  return soma.map((s, w) => ((s + k * media) / (cont[w] + k)) / media)
}

/** Nível diário dessazonalizado, ponderado por recência. */
export function nivelBase(serie, dias, idx, meiaVida = MEIA_VIDA) {
  const n = serie.length
  let num = 0
  let den = 0
  serie.forEach((v, i) => {
    const ind = idx[diaDaSemana(dias[i])]
    if (!(ind > 0)) return
    const peso = 0.5 ** ((n - 1 - i) / meiaVida)
    num += peso * (v / ind)
    den += peso
  })
  return den > 0 ? num / den : 0
}

/** Desvio padrão dos resíduos (real − nível × índice) na janela final. */
export function dispersao(serie, dias, idx, nivel, janela = JANELA_DISPERSAO) {
  const ini = Math.max(0, serie.length - janela)
  const res = []
  for (let i = ini; i < serie.length; i++) res.push(serie[i] - nivel * idx[diaDaSemana(dias[i])])
  if (res.length < 2) return 0
  const m = res.reduce((s, v) => s + v, 0) / res.length
  return Math.sqrt(res.reduce((s, v) => s + (v - m) ** 2, 0) / (res.length - 1))
}

/** Projeção diária para os dias informados. */
export function projetar(serie, dias, diasAlvo, idx = indicesSemana(serie, dias)) {
  const nivel = nivelBase(serie, dias, idx)
  return diasAlvo.map((dia) => nivel * idx[diaDaSemana(dia)])
}

/**
 * Backtest: projeta os últimos `h` dias usando só os anteriores.
 * MAPE só nos dias com venda real; null sem base (treino sem venda ou poucos dias com venda).
 */
export function backtest(serie, dias, h = DIAS_BACKTEST) {
  if (serie.length <= h * 2) return null
  const treino = serie.slice(0, -h)
  const diasTreino = dias.slice(0, -h)
  if (treino.reduce((s, v) => s + v, 0) <= 0) return null
  const prev = projetar(treino, diasTreino, dias.slice(-h))
  const real = serie.slice(-h)
  const erros = []
  real.forEach((r, i) => { if (r > 0) erros.push(Math.abs(r - prev[i]) / r) })
  if (erros.length < MIN_DIAS_MAPE) return null
  const somaReal = real.reduce((s, v) => s + v, 0)
  const somaPrev = prev.reduce((s, v) => s + v, 0)
  return {
    mape: (erros.reduce((s, v) => s + v, 0) / erros.length) * 100,
    vies: somaReal > 0 ? ((somaPrev - somaReal) / somaReal) * 100 : null,
    diasAvaliados: erros.length,
  }
}

/** Tendência: soma dos últimos 7 dias × 7 anteriores (variação %, null sem base). */
export function tendencia7(serie) {
  if (serie.length < 14) return null
  const ult = serie.slice(-7).reduce((s, v) => s + v, 0)
  const ant = serie.slice(-14, -7).reduce((s, v) => s + v, 0)
  return variacao(ult, ant)
}

/** Monta a série de unidades por dia (total e por SKU) a partir dos pedidos. */
export function montarSeries(pedidos, dias) {
  const idx = new Map(dias.map((d, i) => [d, i]))
  const total = Array(dias.length).fill(0)
  const porSku = new Map()
  let itensSemQtd = 0
  let pedidosSemItens = 0
  let itensSemSku = 0
  for (const p of pedidos) {
    if (!pedidoContaComoVenda(p.status)) continue
    const i = idx.get(diaBrt(p.purchased_at))
    if (i == null) continue
    const itens = itensDoPedido(p.payload)
    if (itens.length === 0) { pedidosSemItens++; continue }
    for (const it of itens) {
      if (!it.sku) itensSemSku++
      let s = null
      if (it.sku) {
        s = porSku.get(it.sku)
        if (!s) { s = { sku: it.sku, titulo: it.titulo, serie: Array(dias.length).fill(0), itensSemQtd: 0 }; porSku.set(it.sku, s) }
        if (!s.titulo && it.titulo) s.titulo = it.titulo
      }
      if (it.quantidade == null) { itensSemQtd++; if (s) s.itensSemQtd++; continue }
      total[i] += it.quantidade
      if (s) s.serie[i] += it.quantidade
    }
  }
  return { total, porSku: [...porSku.values()], itensSemQtd, pedidosSemItens, itensSemSku }
}

function faixaTotal(provavel, sigma, h) {
  const banda = Z_FAIXA * sigma * Math.sqrt(h)
  return { conservador: Math.max(0, provavel - banda), provavel, agressivo: provavel + banda }
}

/**
 * @param {{ pedidos: any[], horizonte: number, agora?: Date }} args pedidos dos 90 dias fechados
 */
export function mapPrevisoes({ pedidos, horizonte, agora = new Date() }) {
  const dias = listaDias(DIAS_BASE, agora, 1)
  const futuro = diasFuturos(horizonte, agora)
  const s = montarSeries(pedidos, dias)
  const somaBase = s.total.reduce((a, v) => a + v, 0)
  const declarados = { itensSemQtd: s.itensSemQtd, pedidosSemItens: s.pedidosSemItens, itensSemSku: s.itensSemSku }

  const historico = dias.map((dia, i) => ({ dia, rotulo: rotulo(dia), real: s.total[i], provavel: null, faixa: null }))

  if (somaBase <= 0) {
    return {
      semBase: true,
      base: { inicio: dias[0], fim: dias[dias.length - 1], unidades: 0 },
      declarados,
      kpis: { projecao: null, mediaDiaria: 0, tendencia: null, acuracia: null },
      indices: Array(7).fill(1),
      grafico: [...historico, ...futuro.map((dia) => ({ dia, rotulo: rotulo(dia), real: null, provavel: null, faixa: null }))],
      skus: [],
    }
  }

  const idx = indicesSemana(s.total, dias)
  const nivel = nivelBase(s.total, dias, idx)
  const sigma = dispersao(s.total, dias, idx, nivel)
  const projDia = futuro.map((dia) => nivel * idx[diaDaSemana(dia)])
  const provavel = projDia.reduce((a, v) => a + v, 0)

  const grafico = [
    ...historico,
    ...futuro.map((dia, i) => ({
      dia,
      rotulo: rotulo(dia),
      real: null,
      provavel: projDia[i],
      faixa: [Math.max(0, projDia[i] - Z_FAIXA * sigma), projDia[i] + Z_FAIXA * sigma],
    })),
  ]
  // Liga a linha projetada ao último ponto real.
  grafico[dias.length - 1].provavel = s.total[dias.length - 1]

  const skus = s.porSku.map((k) => {
    const unidades = k.serie.reduce((a, v) => a + v, 0)
    // Índices da LOJA (mais estáveis que os de um SKU isolado) aplicados ao nível do SKU.
    const nivelSku = nivelBase(k.serie, dias, idx)
    const proj = futuro.reduce((a, dia) => a + nivelSku * idx[diaDaSemana(dia)], 0)
    return {
      sku: k.sku,
      titulo: k.titulo,
      unidades90: unidades,
      porDia: unidades / dias.length,
      projecao: proj,
      tendencia: tendencia7(k.serie),
      itensSemQtd: k.itensSemQtd,
    }
  }).sort((a, b) => b.projecao - a.projecao || b.unidades90 - a.unidades90)

  return {
    semBase: false,
    base: { inicio: dias[0], fim: dias[dias.length - 1], unidades: somaBase },
    declarados,
    kpis: {
      projecao: faixaTotal(provavel, sigma, horizonte),
      mediaDiaria: somaBase / dias.length,
      tendencia: tendencia7(s.total),
      acuracia: backtest(s.total, dias),
    },
    indices: idx,
    grafico,
    skus,
  }
}
