/**
 * Diagnóstico da loja, puro: catálogo + pedidos de 30 dias + custos + configuração + sincronizações.
 * Regras de honestidade: estoque nulo não é zero; base pequena não vira "queda"; sem acesso a valores,
 * os alertas de custo/configuração não são emitidos (não dá para saber).
 */
import { agregarPorSku } from '../magalu/itens'
import {
  COBERTURA_MIN_DIAS, QUEDA_FRACAO, QUEDA_MIN_PEDIDOS, SYNC_MAX_HORAS, JANELA_DIAS, SEVERIDADES,
} from './alertas.constants'

const ORDEM = Object.fromEntries(SEVERIDADES.map((s, i) => [s.value, i]))
const lista = (skus, max = 8) => (skus.length > max ? `${skus.slice(0, max).join(', ')} e mais ${skus.length - max}` : skus.join(', '))
const nomeSync = { orders: 'pedidos', skus: 'catálogo (SKUs)' }

/** Divide pedidos em [desde7, agora) e [desde14, desde7) por `purchased_at` (ISO). */
export function dividirSemanas(pedidos, desde7, desde14) {
  const atual = []
  const anterior = []
  for (const p of pedidos) {
    const t = p.purchased_at
    if (!t) continue
    if (t >= desde7) atual.push(p)
    else if (t >= desde14) anterior.push(p)
  }
  return { atual, anterior }
}

function alertasEstoque(vendas30, catalogo) {
  const itens = []
  const naoInformado = []
  for (const v of vendas30.linhas) {
    if (!(v.unidades > 0 || v.pedidos > 0)) continue
    const sku = catalogo.get(v.sku)
    if (!sku || sku.stock == null || !Number.isFinite(Number(sku.stock))) { naoInformado.push(v.sku); continue }
    const estoque = Number(sku.stock)
    const titulo = sku.title ?? v.titulo ?? v.sku
    if (estoque <= 0) {
      itens.push({
        id: `ruptura:${v.sku}`, severidade: 'critico', tipo: 'ruptura',
        titulo: `Sem estoque: ${titulo}`,
        detalhe: `SKU ${v.sku} vendeu ${v.unidades} un. em ${JANELA_DIAS} dias e está com estoque 0.`,
        link: { to: '/anuncios', label: 'Ver anúncios' },
      })
      continue
    }
    // Média só é confiável com todas as quantidades conhecidas.
    if (v.itensSemQtd > 0 || !(v.unidades > 0)) continue
    const mediaDia = v.unidades / JANELA_DIAS
    const cobertura = estoque / mediaDia
    if (cobertura < COBERTURA_MIN_DIAS) {
      itens.push({
        id: `estoque:${v.sku}`, severidade: 'atencao', tipo: 'estoque_baixo',
        titulo: `Estoque baixo: ${titulo}`,
        detalhe: `SKU ${v.sku}: ${estoque} un. cobrem cerca de ${cobertura.toFixed(1).replace('.', ',')} dias pela média de ${JANELA_DIAS} dias (${mediaDia.toFixed(2).replace('.', ',')}/dia).`,
        link: { to: '/anuncios', label: 'Ver anúncios' },
      })
    }
  }
  if (naoInformado.length > 0) {
    itens.push({
      id: 'estoque:nao-informado', severidade: 'monitorar', tipo: 'estoque_nao_informado',
      titulo: `${naoInformado.length} SKU(s) vendido(s) com estoque não informado`,
      detalhe: `Não dá para saber se há ruptura: ${lista(naoInformado)}. Estoque não informado não é estoque zero.`,
      link: { to: '/anuncios', label: 'Ver anúncios' },
    })
  }
  return itens
}

function alertasQueda(pedidosAtual, pedidosAnterior, catalogo) {
  const atual = new Map(agregarPorSku(pedidosAtual).linhas.map((l) => [l.sku, l]))
  const itens = []
  for (const ant of agregarPorSku(pedidosAnterior).linhas) {
    if (ant.pedidos < QUEDA_MIN_PEDIDOS || ant.itensSemValor > 0 || !(ant.receita > 0)) continue
    const at = atual.get(ant.sku)
    if (at && at.itensSemValor > 0) continue
    const receitaAtual = at ? at.receita : 0
    if (receitaAtual < ant.receita * QUEDA_FRACAO) {
      const queda = (1 - receitaAtual / ant.receita) * 100
      const titulo = catalogo.get(ant.sku)?.title ?? ant.titulo ?? ant.sku
      itens.push({
        id: `queda:${ant.sku}`, severidade: 'atencao', tipo: 'queda_vendas',
        titulo: `Queda de vendas: ${titulo}`,
        detalhe: `SKU ${ant.sku}: receita dos últimos 7 dias caiu ${queda.toFixed(0)}% frente aos 7 dias anteriores (${ant.pedidos} pedidos antes).`,
        link: { to: '/pedidos', label: 'Ver pedidos' },
        valores: { anterior: ant.receita, atual: receitaAtual },
      })
    }
  }
  return itens
}

function alertasSync(syncs, agora) {
  const itens = []
  for (const kind of ['orders', 'skus']) {
    const s = syncs?.[kind]
    const nome = nomeSync[kind]
    const link = { to: '/configuracoes', label: 'Abrir Configurações' }
    if (!s) {
      itens.push({ id: `sync:${kind}`, severidade: 'atencao', tipo: 'sync', titulo: `Sem registro de sincronização de ${nome}`, detalhe: 'Não há sincronização registrada (ou não foi possível lê-la).', link })
      continue
    }
    if (s.error) {
      itens.push({ id: `sync:${kind}:erro`, severidade: 'critico', tipo: 'sync', titulo: `A última sincronização de ${nome} falhou`, detalhe: String(s.error), link })
    } else if (s.truncated) {
      itens.push({ id: `sync:${kind}:parcial`, severidade: 'atencao', tipo: 'sync', titulo: `A última sincronização de ${nome} ficou incompleta`, detalhe: 'A leitura foi interrompida antes do fim; os números podem estar parciais.', link })
    }
    const fim = s.finished_at ? new Date(s.finished_at).getTime() : Number.NaN
    if (!Number.isFinite(fim)) {
      itens.push({ id: `sync:${kind}:sem-fim`, severidade: 'atencao', tipo: 'sync', titulo: `Sincronização de ${nome} sem horário de término`, detalhe: 'Pode estar em andamento ou ter sido interrompida.', link })
    } else {
      const horas = (agora.getTime() - fim) / 3_600_000
      if (horas > SYNC_MAX_HORAS) {
        itens.push({ id: `sync:${kind}:velha`, severidade: 'atencao', tipo: 'sync', titulo: `Dados de ${nome} com mais de ${SYNC_MAX_HORAS}h`, detalhe: `Última sincronização há ${Math.floor(horas)} horas.`, link })
      }
    }
  }
  return itens
}

/**
 * @param {object} p
 * @param {Array} p.skus linhas cruas de magalu.skus
 * @param {Array} p.pedidos pedidos dos últimos 30 dias (com payload)
 * @param {{desde7:string, desde14:string}} p.limites ISO de início das duas semanas
 * @param {Map<string,number>} p.custos
 * @param {object|null} p.cfg
 * @param {boolean} p.podeVerValores
 * @param {{orders:object|null, skus:object|null}} p.syncs
 * @param {Date} [p.agora]
 */
export function diagnosticar({ skus, pedidos, limites, custos, cfg, podeVerValores, syncs, agora = new Date() }) {
  const catalogo = new Map(skus.map((s) => [String(s.sku), s]))
  const vendas30 = agregarPorSku(pedidos)
  const { atual, anterior } = dividirSemanas(pedidos, limites.desde7, limites.desde14)
  const itens = [
    ...alertasEstoque(vendas30, catalogo),
    ...alertasQueda(atual, anterior, catalogo),
  ]

  if (podeVerValores) {
    const semCusto = vendas30.linhas.filter((v) => (v.unidades > 0 || v.pedidos > 0) && !custos.has(v.sku)).map((v) => v.sku)
    if (semCusto.length > 0) {
      itens.push({
        id: 'custo:faltando', severidade: 'atencao', tipo: 'sem_custo',
        titulo: `${semCusto.length} SKU(s) vendido(s) sem custo cadastrado`,
        detalhe: `Sem custo a margem fica indisponível: ${lista(semCusto)}.`,
        link: { to: '/produtos', label: 'Cadastrar custos' },
      })
    }
    const faltando = []
    // A Magalu informa a comissão por item; o % só faz falta se algum item veio sem ela.
    if (cfg?.commission_pct == null && vendas30.linhas.some((v) => v.itensSemComissao > 0)) faltando.push('comissão da Magalu')
    if (cfg?.tax_pct == null) faltando.push('alíquota de imposto')
    if (faltando.length > 0) {
      itens.push({
        id: 'config:faltando', severidade: 'atencao', tipo: 'config',
        titulo: `Configuração financeira incompleta: ${faltando.join(' e ')}`,
        detalhe: 'Sem esses percentuais a margem de contribuição não pode ser calculada.',
        link: { to: '/impostos', label: 'Configurar' },
      })
    }
  }

  itens.push(...alertasSync(syncs, agora))
  itens.sort((a, b) => (ORDEM[a.severidade] - ORDEM[b.severidade]) || a.titulo.localeCompare(b.titulo, 'pt-BR'))

  const grupos = SEVERIDADES.map((s) => ({ ...s, itens: itens.filter((i) => i.severidade === s.value) }))
  return { itens, grupos, semSku: vendas30.semSku }
}
