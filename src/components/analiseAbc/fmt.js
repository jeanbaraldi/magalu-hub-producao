import { brl, inteiro } from '../magalu/formatos'
/** Valor da métrica escolhida: receita em R$, unidades em número. */
export const fmtMetrica = (v, metrica) => (metrica === 'unidades' ? inteiro(v) : brl(v))
