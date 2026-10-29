/**
 * Diagnóstico de Produtos do Gestor Magalu. Funções PURAS.
 * Mesmos sinais do Diagnóstico do Gestor ML, calculados a partir dos pedidos (vendas por dia
 * de Brasília) e do catálogo. Janelas em dias FECHADOS (até ontem). Janela que começa antes do
 * primeiro pedido gravado não dispara sinal: antes disso a venda é desconhecida, não zero.
 */
import { itensDoPedido } from '../magalu/itens'
import { pedidoContaComoVenda, diaBrt } from '../magalu/vendas'
import { DEFS_BY_CODE, PARAMS, SEVERIDADE_CONFIG } from './diagnostico.constants'

const DIAS = 60
const DIA_MS = 86_400_000

export function deslocarDia(dia, delta) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

const soma = (a) => a.reduce((s, v) => s + v, 0)
const mediana = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const varPct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)
const fmt = (n) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)
const ddmm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

/**
 * Vendas por SKU e por dia de Brasília (só pedidos que contam como venda) e o último dia
 * com venda de cada SKU. Item sem quantidade não entra.
 */
export function vendasPorDia(pedidos) {
  const porSku = new Map()
  const ultima = new Map()
  for (const p of pedidos) {
    if (!pedidoContaComoVenda(p.status)) continue
    const dia = diaBrt(p.purchased_at)
    if (!dia) continue
    for (const it of itensDoPedido(p.payload)) {
      if (!it.sku || it.quantidade == null) continue
      const m = porSku.get(it.sku) ?? new Map()
      m.set(dia, (m.get(dia) ?? 0) + it.quantidade)
      porSku.set(it.sku, m)
      if (!ultima.has(it.sku) || dia > ultima.get(it.sku)) ultima.set(it.sku, dia)
    }
  }
  return { porSku, ultima }
}

/**
 * @param {Array<object>} catalogo linhas de mapCatalogo (com curva, margem30, estoque, status)
 * @param {{ porSku: Map<string, Map<string, number>>, ultima: Map<string, string> }} vendas vendasPorDia
 * @param {string} hoje dia de hoje em Brasília (YYYY-MM-DD)
 * @param {string|null} desde primeiro dia com pedido gravado na loja
 */
export function buildDiagnostico(catalogo, vendas, hoje, desde) {
  const fim = deslocarDia(hoje, -1)
  const dias = Array.from({ length: DIAS }, (_, i) => deslocarDia(fim, i - (DIAS - 1)))
  const temHistorico = (diasAtras) => desde != null && dias[DIAS - diasAtras] >= desde
  const semanasOk = temHistorico(35)
  const ultimo = DIAS - 1
  const queda = PARAMS.Q_QUEDA_PCT / 100

  const medVendas = mediana(catalogo.filter((r) => (r.vendas30 ?? 0) > 0).map((r) => r.vendas30))
  const rows = []
  for (const r of catalogo) {
    const m = vendas.porSku.get(r.sku)
    const serie = dias.map((d) => m?.get(d) ?? 0)
    const ev = []
    const add = (codigo, texto) => ev.push({ codigo, texto })
    const vendas30 = soma(serie.slice(DIAS - 30))
    const vendasPrev30 = soma(serie.slice(0, DIAS - 30))
    const vendas7 = soma(serie.slice(DIAS - 7))
    const vendasPrev7 = soma(serie.slice(DIAS - 14, DIAS - 7))
    const cobertura = r.estoque != null && vendas30 > 0 ? r.estoque / (vendas30 / 30) : null
    const semana = (k) => soma(serie.slice(ultimo - 7 * k - 6, ultimo - 7 * k + 1))
    const w = [0, 1, 2, 3, 4].map(semana)

    if (r.margem30 != null && (r.vendas30 ?? 0) > 0 && r.margem30 < PARAMS.P01_PISO_PCT) {
      add('P01_MARGEM_ABAIXO_PISO', `Margem de contribuição de ${fmt(r.margem30)}% em 30 dias, abaixo do piso de ${PARAMS.P01_PISO_PCT}%.`)
    }
    if (vendas30 >= PARAMS.P02_VENDAS_30D_MIN && (r.estoque === 0 || r.pausado)) {
      add('P02_SEM_ESTOQUE_COM_DEMANDA', `${fmt(vendas30)} vendas em 30 dias e ${r.estoque === 0 ? 'estoque zerado' : `SKU ${r.statusInfo.label.toLowerCase()}`}.`)
    }
    if (semanasOk) {
      const ref = w.slice(1)
      const med = mediana(ref)
      if (med >= PARAMS.Q03_UNIDADES_REF_MIN && w[0] <= med * (1 - queda) && w[0] < Math.min(...ref)) {
        add('Q03_QUEDA_GERAL', `${fmt(w[0])} vendas nos últimos 7 dias contra a mediana de ${fmt(med)} das 4 semanas anteriores (${fmt(((w[0] - med) / med) * 100)}%).`)
      }
    }
    const ultimaVenda = vendas.ultima.get(r.sku) ?? null
    const diasDesde = (d) => Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${d}T12:00:00Z`)) / DIA_MS)
    const semVenda = ultimaVenda ? diasDesde(ultimaVenda) : desde ? diasDesde(desde) : null
    if (r.ativo && r.estoque != null && r.estoque > 0 && semVenda != null && semVenda >= PARAMS.E01_DIAS_SEM_VENDA) {
      add('E01_ZUMBI', ultimaVenda
        ? `Última venda há ${semVenda} dias, com ${fmt(r.estoque)} em estoque.`
        : `Nenhuma venda desde ${ddmm(desde)} (início dos pedidos gravados, ${semVenda} dias), com ${fmt(r.estoque)} em estoque.`)
    }
    if (temHistorico(28) && w[0] >= PARAMS.S02_VENDAS_7D_MIN && w[3] < w[2] && w[2] < w[1] && w[1] < w[0]) {
      add('S02_CRESCIMENTO_CONSISTENTE', `Vendas por semana: ${w[3]} → ${w[2]} → ${w[1]} → ${w[0]}.`)
    }
    if (r.estoque != null && r.estoque > 0 && vendas30 >= PARAMS.S03_VENDAS_30D_MIN && cobertura != null && cobertura < PARAMS.S03_COBERTURA_DIAS_MAX) {
      add('S03_RUPTURA_IMINENTE', `${fmt(r.estoque)} em estoque para ${fmt(vendas30 / 30)} vendas por dia: cobertura de ${fmt(cobertura)} dias.`)
    }
    if (r.margem30 != null && r.margem30 >= PARAMS.S04_MARGEM_MIN_PCT && medVendas != null && (r.vendas30 ?? 0) > 0 && r.vendas30 < medVendas) {
      add('S04_MARGEM_ALTA_VOLUME_BAIXO', `Margem de ${fmt(r.margem30)}% com ${fmt(r.vendas30)} vendas em 30 dias (mediana da loja ${fmt(medVendas)}).`)
    }
    if (!ev.length) continue

    const sev = (c) => (c === 'S03_RUPTURA_IMINENTE' && r.curva === 'A' ? 'critica' : DEFS_BY_CODE[c].severidade)
    ev.sort((a, b) => SEVERIDADE_CONFIG[sev(b.codigo)].rank - SEVERIDADE_CONFIG[sev(a.codigo)].rank)
    rows.push({
      sku: r.sku,
      titulo: r.titulo,
      imagem: r.imagem,
      pausado: r.pausado,
      statusLabel: r.statusInfo.label,
      curva: r.curva,
      sinais: ev.map((e) => e.codigo),
      evidencias: ev,
      severidades: Object.fromEntries(ev.map((e) => [e.codigo, sev(e.codigo)])),
      severidadeMax: sev(ev[0].codigo),
      vendas7,
      vendas7VarPct: temHistorico(14) ? varPct(vendas7, vendasPrev7) : null,
      vendas30,
      vendas30VarPct: temHistorico(60) ? varPct(vendas30, vendasPrev30) : null,
      faturamento30: r.receita30,
      estoque: r.estoque,
      coberturaDias: cobertura == null ? null : Math.round(cobertura),
      margemPct: r.margem30,
      serie: dias.map((d, i) => ({ date: d, vendas: serie[i] })),
    })
  }
  return rows
}

export function resumoDiagnostico(rows) {
  const porFamilia = { escala: 0, problema: 0, queda: 0, estagnado: 0 }
  let criticos = 0
  for (const r of rows) {
    for (const f of new Set(r.sinais.map((s) => DEFS_BY_CODE[s].familia))) porFamilia[f] += 1
    if (r.severidadeMax === 'critica') criticos += 1
  }
  return { porFamilia, criticos }
}

export const FILTROS_VAZIOS = { familia: null, sinal: null, severidade: null, curva: null, busca: '' }

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filtrarDiagnostico(rows, f) {
  const q = fold(f.busca.trim())
  return rows.filter((r) =>
    (!f.familia || r.sinais.some((s) => DEFS_BY_CODE[s].familia === f.familia))
    && (!f.sinal || r.sinais.includes(f.sinal))
    && (!f.severidade || r.sinais.some((s) => r.severidades[s] === f.severidade))
    && (!f.curva || r.curva === f.curva)
    && (!q || fold(r.titulo).includes(q) || fold(r.sku).includes(q)))
}

/** Sem ordem escolhida: severidade e depois faturamento. */
export function ordenarDiagnostico(rows, chave, dir) {
  const out = [...rows]
  if (!chave) {
    return out.sort((a, b) => SEVERIDADE_CONFIG[b.severidadeMax].rank - SEVERIDADE_CONFIG[a.severidadeMax].rank
      || (b.faturamento30 ?? 0) - (a.faturamento30 ?? 0))
  }
  return out.sort((a, b) => {
    const x = a[chave]; const y = b[chave]
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    return dir === 'desc' ? y - x : x - y
  })
}
