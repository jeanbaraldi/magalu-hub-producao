/**
 * Vendas Hoje — mapper PURO (sem React, sem fetch). `agora` é sempre injetado.
 *
 * Comparação justa: hoje até `agora` × ontem até a MESMA hora de Brasília
 * (mesmo tempo decorrido desde a meia-noite BRT). Comparar hoje parcial com
 * ontem inteiro faria todo dia parecer queda.
 */
import { pedidoContaComoVenda, pedidoCancelado, inicioDoPeriodo, somarReceita } from '../magalu/vendas'
import { itensDoPedido, agregarPorSku } from '../magalu/itens'
import { RECENTES_MAX, RANKING_MAX } from './vendas.constants'
import { statusInfo } from '../pedidos/pedidos.mapper'

const FMT_HORA = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' })

/** Hora (0..23) em Brasília. */
export function horaBrt(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Number(FMT_HORA.format(d)) % 24
}

const ms = (iso) => {
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

/** Variação % de `atual` sobre `anterior`; null quando não dá para comparar (base 0 ou desconhecida). */
export function variacao(atual, anterior) {
  if (atual == null || anterior == null || !Number.isFinite(atual) || !Number.isFinite(anterior)) return null
  if (anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}

/**
 * Unidades vendidas: soma das quantidades legíveis. Item sem quantidade e pedido sem
 * itens legíveis entram em `semQtd` — nunca contam como zero.
 */
export function somarUnidades(pedidos) {
  let total = 0
  let conhecidas = 0
  let semQtd = 0
  for (const p of pedidos) {
    const itens = itensDoPedido(p.payload)
    if (itens.length === 0) { semQtd++; continue }
    for (const it of itens) {
      if (it.quantidade == null) semQtd++
      else { total += it.quantidade; conhecidas++ }
    }
  }
  return { total: conhecidas > 0 ? total : null, semQtd }
}

function kpisDe(vendas) {
  const r = somarReceita(vendas)
  const u = somarUnidades(vendas)
  // Sem nenhuma venda o total é ZERO real (o espelho foi lido inteiro);
  // com vendas mas todas ilegíveis, é desconhecido (null).
  const vazio = vendas.length === 0
  return {
    receita: vazio ? 0 : r.total,
    semValor: r.semValor,
    pedidos: vendas.length,
    unidades: vazio ? 0 : u.total,
    semQtd: u.semQtd,
    ticket: r.total != null && r.conhecidos > 0 ? r.total / r.conhecidos : null,
  }
}

function tituloDoPedido(payload) {
  const [primeiro, ...resto] = itensDoPedido(payload)
  if (!primeiro) return null
  const t = primeiro.titulo ?? primeiro.sku
  if (!t) return null
  return resto.length > 0 ? `${t} + ${resto.length} item(ns)` : t
}

export function mapVendasHoje(pedidos, agora = new Date()) {
  const agoraMs = agora.getTime()
  const inicioHoje = ms(inicioDoPeriodo(1, agora))
  const inicioOntem = ms(inicioDoPeriodo(2, agora))
  const decorrido = agoraMs - inicioHoje
  const limiteOntem = inicioOntem + decorrido

  const hoje = []
  const ontemAteHora = []
  const ontemTodo = []
  for (const p of pedidos) {
    const t = ms(p.purchased_at)
    if (t == null) continue
    if (t >= inicioHoje && t <= agoraMs) hoje.push(p)
    else if (t >= inicioOntem && t < inicioHoje) {
      ontemTodo.push(p)
      if (t < limiteOntem) ontemAteHora.push(p)
    }
  }

  const vendasHoje = hoje.filter((p) => pedidoContaComoVenda(p.status))
  const vendasOntem = ontemAteHora.filter((p) => pedidoContaComoVenda(p.status))
  const atual = kpisDe(vendasHoje)
  const antes = kpisDe(vendasOntem)

  const horaAgora = horaBrt(agora.toISOString())
  const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: h, hoje: [], ontem: [] }))
  for (const p of vendasHoje) { const h = horaBrt(p.purchased_at); if (h != null) porHora[h].hoje.push(p) }
  for (const p of ontemTodo.filter((x) => pedidoContaComoVenda(x.status))) {
    const h = horaBrt(p.purchased_at); if (h != null) porHora[h].ontem.push(p)
  }
  const horas = porHora.map(({ hora, hoje: lh, ontem: lo }) => {
    const futuro = hora > horaAgora
    const rh = somarReceita(lh)
    const ro = somarReceita(lo)
    return {
      hora,
      rotulo: `${String(hora).padStart(2, '0')}h`,
      futuro,
      estado: futuro ? 'futuro' : hora === horaAgora ? 'agora' : 'passado',
      // Hora futura não tem venda ainda: null (barra apagada), nunca zero.
      receita: futuro ? null : (lh.length === 0 ? 0 : rh.total),
      pedidos: futuro ? null : lh.length,
      receitaOntem: lo.length === 0 ? 0 : ro.total,
    }
  })

  const recentes = [...hoje]
    .sort((a, b) => (ms(b.purchased_at) ?? 0) - (ms(a.purchased_at) ?? 0))
    .slice(0, RECENTES_MAX)
    .map((p) => ({
      id: String(p.order_id),
      status: p.status,
      statusInfo: statusInfo(p.status),
      venda: pedidoContaComoVenda(p.status),
      cancelado: pedidoCancelado(p.status),
      compradoEm: p.purchased_at,
      total: p.total_amount == null || !Number.isFinite(Number(p.total_amount)) ? null : Number(p.total_amount),
      titulo: tituloDoPedido(p.payload),
    }))

  const { linhas, semSku } = agregarPorSku(hoje)
  const ranking = [...linhas]
    .sort((a, b) => b.receita - a.receita || b.unidades - a.unidades)
    .slice(0, RANKING_MAX)
    // Nenhum item com valor legível: receita desconhecida, não R$ 0.
    .map((l) => ({ ...l, receita: l.itensSemValor > 0 && l.receita === 0 ? null : l.receita }))

  // Última VENDA de hoje (cancelado e pagamento não aprovado não contam).
  let ultimaVenda = null
  for (const p of vendasHoje) {
    if (ultimaVenda == null || ms(p.purchased_at) > ms(ultimaVenda)) ultimaVenda = p.purchased_at
  }

  return {
    kpis: {
      ...atual,
      ultimaVenda,
      cancelados: hoje.filter((p) => pedidoCancelado(p.status)).length,
      variacao: {
        receita: variacao(atual.receita, antes.receita),
        pedidos: variacao(atual.pedidos, antes.pedidos),
        unidades: variacao(atual.unidades, antes.unidades),
        ticket: variacao(atual.ticket, antes.ticket),
      },
      ontem: antes,
    },
    horas,
    horaAgora,
    recentes,
    ranking,
    rankingSemSku: semSku,
    totalHoje: hoje.length,
  }
}

/** Erro que o magalu-sync devolve DENTRO de um 200 (uma loja falha sem derrubar as outras). */
export function erroDoSync(corpo, contaId) {
  const conta = corpo?.accounts?.find((a) => String(a.account_id) === String(contaId))
  if (!conta) return null
  if (conta.error) return String(conta.error)
  if (conta.skipped) return `sincronização pulada (${conta.skipped})`
  if (conta.orders?.error) return String(conta.orders.error)
  return null
}
