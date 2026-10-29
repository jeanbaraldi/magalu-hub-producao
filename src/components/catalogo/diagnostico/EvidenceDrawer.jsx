// Drawer de evidência: cada sinal em linguagem clara (números exatos) e o mini-gráfico de
// vendas dos últimos 60 dias. Mesmo desenho do Gestor ML, sem a linha de visitas (a Magalu
// não entrega visitas).
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '../../../lib/utils'
import { DEFS_BY_CODE, FAMILIA_CONFIG, SEVERIDADE_CONFIG } from '../../../features/catalogo/diagnostico.constants'

/** Para onde cada sinal leva para ser resolvido (telas que existem no Gestor Magalu). */
const ACAO = {
  P01_MARGEM_ABAIXO_PISO: { label: 'Revisar custo', rota: '/produtos?aba=custos' },
  P02_SEM_ESTOQUE_COM_DEMANDA: { label: 'Ver anúncios', rota: '/anuncios' },
  Q03_QUEDA_GERAL: { label: 'Ver performance', rota: '/performance' },
  E01_ZUMBI: { label: 'Ver anúncios', rota: '/anuncios' },
  S02_CRESCIMENTO_CONSISTENTE: { label: 'Ver previsões', rota: '/previsoes' },
  S03_RUPTURA_IMINENTE: { label: 'Ver previsões', rota: '/previsoes' },
  S04_MARGEM_ALTA_VOLUME_BAIXO: { label: 'Ver performance', rota: '/performance' },
}

const ddmm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

export default function EvidenceDrawer({ row, onClose }) {
  const navigate = useNavigate()
  const hasVendas = row.serie.some((p) => p.vendas > 0)

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Evidência: ${row.titulo}`}>
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-start gap-3 p-4 border-b border-slate-100">
          {row.imagem && <img src={row.imagem} alt="" className="w-11 h-11 rounded-lg border border-slate-200 object-cover flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 leading-snug">{row.titulo}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">SKU {row.sku}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1" aria-label="Fechar painel">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasVendas && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Últimos 60 dias — vendas</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={row.serie} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={ddmm} minTickGap={28} />
                    <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip labelFormatter={(d) => ddmm(String(d))} formatter={(value) => [value, 'Vendas']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="vendas" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {row.evidencias.map((item) => {
            const def = DEFS_BY_CODE[item.codigo]
            const fam = FAMILIA_CONFIG[def.familia]
            const sev = SEVERIDADE_CONFIG[row.severidades[item.codigo]]
            const acao = ACAO[item.codigo]
            return (
              <div key={item.codigo} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('w-2 h-2 rounded-full', fam.dot)} />
                  <span className="text-xs font-bold text-slate-900">{def.nome}</span>
                  <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold', sev.badge)}>{sev.label}</span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed text-slate-600">{item.texto}</p>
                <p className="text-[11px] mt-1 text-slate-400">{def.descricao}</p>
                {acao && (
                  <div className="mt-1.5">
                    <button type="button" onClick={() => { onClose(); navigate(acao.rota) }}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-mg-blue hover:bg-mg-blue-dark rounded-lg px-2.5 py-1">
                      {acao.label} <ArrowUpRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
