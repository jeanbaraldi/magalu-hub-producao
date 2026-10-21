/**
 * Relatórios — mapper PURO (sem React, sem fetch). `agora` é injetado.
 *
 * ESCOLHA DOCUMENTADA DO PERÍODO: o período atual são os últimos N dias de Brasília
 * INCLUINDO hoje (parcial); o anterior são os N dias imediatamente antes, todos fechados.
 * Isso deixa o atual levemente em desvantagem (hoje ainda não acabou), então uma alta
 * mostrada aqui é conservadora. Mesma convenção do Dashboard e de Pedidos.
 */
import { pedidoContaComoVenda, pedidoCancelado, diaBrt, somarReceita } from '../magalu/vendas'
import { agregarPorSku } from '../magalu/itens'
import { somarUnidades, variacao } from '../vendas/vendas.mapper'
import { DIAS_SEMANA, TOP_SKUS } from './relatorios.constants'

/** Lista de dias BRT (YYYY-MM-DD) do mais antigo ao mais novo; termina `fimOffset` dias antes de hoje. */
export function listaDias(dias, agora = new Date(), fimOffset = 0) {
  const [a, m, d] = diaBrt(agora.toISOString()).split('-').map(Number)
  const out = []
  for (let i = dias - 1 + fimOffset; i >= fimOffset; i--) out.push(new Date(Date.UTC(a, m - 1, d - i)).toISOString().slice(0, 10))
  return out
}

/** Dia da semana (0 = domingo) de uma data YYYY-MM-DD. */
export function diaDaSemana(dia) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

const rotulo = (dia) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`

function resumo(pedidos) {
  const vendas = pedidos.filter((p) => pedidoContaComoVenda(p.status))
  const r = somarReceita(vendas)
  const u = somarUnidades(vendas)
  const vazio = vendas.length === 0
  return {
    receita: vazio ? 0 : r.total,
    semValor: r.semValor,
    pedidos: vendas.length,
    unidades: vazio ? 0 : u.total,
    semQtd: u.semQtd,
    ticket: r.total != null && r.conhecidos > 0 ? r.total / r.conhecidos : null,
    cancelados: pedidos.filter((p) => pedidoCancelado(p.status)).length,
  }
}

function receitaDoDia(lista) {
  const vendas = lista.filter((p) => pedidoContaComoVenda(p.status))
  return vendas.length === 0 ? 0 : somarReceita(vendas).total
}

/**
 * @param {{ pedidos: any[], dias: number, agora?: Date }} args pedidos dos últimos 2×N dias BRT
 */
export function mapRelatorio({ pedidos, dias, agora = new Date() }) {
  const diasAtual = listaDias(dias, agora)
  const diasAnterior = listaDias(dias, agora, dias)
  const idxAtual = new Map(diasAtual.map((d, i) => [d, i]))
  const idxAnterior = new Map(diasAnterior.map((d, i) => [d, i]))

  const porDiaAtual = diasAtual.map(() => [])
  const porDiaAnterior = diasAnterior.map(() => [])
  for (const p of pedidos) {
    const d = diaBrt(p.purchased_at)
    if (idxAtual.has(d)) porDiaAtual[idxAtual.get(d)].push(p)
    else if (idxAnterior.has(d)) porDiaAnterior[idxAnterior.get(d)].push(p)
  }
  const atuais = porDiaAtual.flat()
  const anteriores = porDiaAnterior.flat()

  const a = resumo(atuais)
  const b = resumo(anteriores)
  const kpis = {
    atual: a,
    anterior: b,
    variacao: {
      receita: variacao(a.receita, b.receita),
      pedidos: variacao(a.pedidos, b.pedidos),
      unidades: variacao(a.unidades, b.unidades),
      ticket: variacao(a.ticket, b.ticket),
      cancelados: variacao(a.cancelados, b.cancelados),
    },
  }

  const serie = diasAtual.map((dia, i) => ({
    dia,
    rotulo: rotulo(dia),
    rotuloAnterior: rotulo(diasAnterior[i]),
    atual: receitaDoDia(porDiaAtual[i]),
    anterior: receitaDoDia(porDiaAnterior[i]),
  }))

  // Receita por dia da semana (período atual). Média por ocorrência do dia na janela.
  const semana = DIAS_SEMANA.map((nome, dow) => ({ dow, nome: nome.slice(0, 3), nomeCompleto: nome, receita: 0, ocorrencias: 0, desconhecidos: 0 }))
  serie.forEach((s) => {
    const w = semana[diaDaSemana(s.dia)]
    w.ocorrencias++
    if (s.atual == null) w.desconhecidos++
    else w.receita += s.atual
  })
  const porDiaSemana = semana.map((w) => ({
    ...w,
    receita: w.ocorrencias === 0 || w.desconhecidos === w.ocorrencias ? null : w.receita,
    media: w.ocorrencias === 0 || w.desconhecidos === w.ocorrencias ? null : w.receita / (w.ocorrencias - w.desconhecidos),
  }))

  const skuAtual = agregarPorSku(atuais)
  const skuAnterior = agregarPorSku(anteriores)
  const antPorSku = new Map(skuAnterior.linhas.map((l) => [l.sku, l]))
  const receitaSku = (l) => (l == null ? 0 : l.itensSemValor > 0 && l.receita === 0 ? null : l.receita)
  const topSkus = [...skuAtual.linhas]
    .sort((x, y) => y.receita - x.receita || y.unidades - x.unidades)
    .slice(0, TOP_SKUS)
    .map((l) => {
      const ant = antPorSku.get(l.sku)
      const receita = receitaSku(l)
      const receitaAnterior = receitaSku(ant)
      return {
        sku: l.sku,
        titulo: l.titulo ?? ant?.titulo ?? null,
        unidades: l.unidades,
        receita,
        receitaAnterior,
        unidadesAnterior: ant ? ant.unidades : 0,
        variacao: variacao(receita, receitaAnterior),
        itensSemValor: l.itensSemValor,
        itensSemQtd: l.itensSemQtd,
        pedidos: l.pedidos,
      }
    })

  return {
    kpis,
    serie,
    porDiaSemana,
    topSkus,
    semSku: skuAtual.semSku,
    periodo: { inicio: diasAtual[0], fim: diasAtual[diasAtual.length - 1] },
    periodoAnterior: { inicio: diasAnterior[0], fim: diasAnterior[diasAnterior.length - 1] },
  }
}
