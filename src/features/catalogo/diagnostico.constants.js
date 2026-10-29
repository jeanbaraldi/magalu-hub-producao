// Diagnóstico de Produtos do Gestor Magalu: mesmos sinais, famílias, cores e réguas do
// Diagnóstico do Gestor ML (ml.signal_definitions), sem os que pedem dado que a Magalu não
// entrega: visitas (queda de tráfego e de conversão, tráfego sem venda, alta conversão),
// saúde do anúncio, perguntas e Buy Box.

export const FAMILIA_ORDER = ['problema', 'queda', 'estagnado', 'escala']

export const FAMILIA_CONFIG = {
  escala: { label: 'Escala', hint: 'Oportunidade de vender mais', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', emptyMessage: 'Nenhuma oportunidade de escala detectada hoje.' },
  problema: { label: 'Problema', hint: 'Vazando dinheiro ou em risco', chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', emptyMessage: 'Nenhum problema ativo. 🎉' },
  queda: { label: 'Queda', hint: 'Perdendo venda (causa decomposta)', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', emptyMessage: 'Nenhum produto em queda. 🎉' },
  estagnado: { label: 'Estagnado', hint: 'Parado prendendo capital', chip: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', emptyMessage: 'Nenhum produto estagnado.' },
}

export const SEVERIDADE_ORDER = ['critica', 'alta', 'media', 'info']

export const SEVERIDADE_CONFIG = {
  critica: { label: 'Crítica', badge: 'bg-red-600 text-white', rank: 3 },
  alta: { label: 'Alta', badge: 'bg-orange-100 text-orange-700 border border-orange-200', rank: 2 },
  media: { label: 'Média', badge: 'bg-amber-100 text-amber-700 border border-amber-200', rank: 1 },
  info: { label: 'Info', badge: 'bg-slate-100 text-slate-600 border border-slate-200', rank: 0 },
}

export const CURVE_OPTIONS = ['A', 'B', 'C']
export const DIAG_PAGE_SIZE = 50
export const COBERTURA_ALERT_DIAS = 10

/** Os mesmos parâmetros de ml.signal_definitions. */
export const PARAMS = {
  E01_DIAS_SEM_VENDA: 45,
  P01_PISO_PCT: 10,
  P02_VENDAS_30D_MIN: 3,
  Q_QUEDA_PCT: 20,
  Q03_UNIDADES_REF_MIN: 5,
  S02_VENDAS_7D_MIN: 5,
  S03_COBERTURA_DIAS_MAX: 10,
  S03_VENDAS_30D_MIN: 5,
  S04_MARGEM_MIN_PCT: 25,
}

export const SIGNAL_DEFS = [
  { codigo: 'P01_MARGEM_ABAIXO_PISO', familia: 'problema', nome: 'Margem abaixo do piso', severidade: 'critica',
    descricao: 'Margem de contribuição de 30 dias abaixo de 10%. Requer custo cadastrado e alíquota.' },
  { codigo: 'P02_SEM_ESTOQUE_COM_DEMANDA', familia: 'problema', nome: 'Sem estoque com demanda', severidade: 'critica',
    descricao: 'Estoque zerado ou SKU não publicado com 3 ou mais vendas em 30 dias — dinheiro parado na porta.' },
  { codigo: 'Q03_QUEDA_GERAL', familia: 'queda', nome: 'Queda geral de vendas', severidade: 'alta',
    descricao: 'Unidades dos últimos 7 dias ao menos 20% abaixo da mediana das 4 semanas anteriores e abaixo da menor delas, com referência de 5 ou mais.' },
  { codigo: 'E01_ZUMBI', familia: 'estagnado', nome: 'Produto zumbi', severidade: 'info',
    descricao: 'Nenhuma venda há 45 dias ou mais, com estoque e SKU publicado — capital preso.' },
  { codigo: 'S02_CRESCIMENTO_CONSISTENTE', familia: 'escala', nome: 'Crescimento consistente', severidade: 'media',
    descricao: 'Vendas subindo em 3 semanas seguidas, com 5 ou mais na última — momento de escalar.' },
  { codigo: 'S03_RUPTURA_IMINENTE', familia: 'escala', nome: 'Ruptura iminente', severidade: 'alta',
    descricao: 'Cobertura de estoque (estoque ÷ média diária de 30 dias) abaixo de 10 dias com 5 ou mais vendas. Crítica se curva A.' },
  { codigo: 'S04_MARGEM_ALTA_VOLUME_BAIXO', familia: 'escala', nome: 'Margem alta, volume baixo', severidade: 'info',
    descricao: 'Margem de 25% ou mais com vendas de 30 dias abaixo da mediana da loja — dá para investir em volume. Requer custo cadastrado.' },
]

export const DEFS_BY_CODE = Object.fromEntries(SIGNAL_DEFS.map((d) => [d.codigo, d]))
