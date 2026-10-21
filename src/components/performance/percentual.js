/** Percentual já em 0-100; ausente vira "—". */
export const pct = (v, casas = 1) => (v == null || !Number.isFinite(Number(v)) ? '—' : `${Number(v).toFixed(casas).replace('.', ',')}%`)
export const corMargem = (v) => (v == null ? 'text-slate-400' : v >= 20 ? 'text-emerald-600' : v >= 10 ? 'text-blue-600' : v >= 0 ? 'text-amber-600' : 'text-rose-600')
