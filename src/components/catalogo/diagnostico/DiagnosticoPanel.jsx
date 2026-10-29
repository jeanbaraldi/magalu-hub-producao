// Painel completo da aba Diagnóstico. Burro quanto a dados (tudo via props); segura só o
// estado de UI (filtros, ordem, página, drawer) e roda os mappers puros. Igual ao Gestor ML.
import { useMemo, useState } from 'react'
import { AlertCircle, Stethoscope } from 'lucide-react'
import { FILTROS_VAZIOS, filtrarDiagnostico, ordenarDiagnostico, resumoDiagnostico } from '../../../features/catalogo/diagnostico.mapper'
import { FAMILIA_CONFIG } from '../../../features/catalogo/diagnostico.constants'
import DiagnosticoSummaryCards from './DiagnosticoSummaryCards'
import DiagnosticoToolbar from './DiagnosticoToolbar'
import DiagnosticoTable from './DiagnosticoTable'
import EvidenceDrawer from './EvidenceDrawer'

const ddmmaaaa = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

export default function DiagnosticoPanel({ rows, loading, error, desde, podeVerValores, onRefresh }) {
  const [filters, setFilters] = useState(FILTROS_VAZIOS)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [drawerRow, setDrawerRow] = useState(null)

  const patchFilters = (p) => { setFilters((f) => ({ ...f, ...p })); setPage(0) }
  const summary = useMemo(() => resumoDiagnostico(rows ?? []), [rows])
  const sorted = useMemo(() => ordenarDiagnostico(filtrarDiagnostico(rows ?? [], filters), sortKey, sortDir), [rows, filters, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === 'desc') setSortDir('asc')
      else { setSortKey(null); setSortDir('desc') } // 3º clique volta ao padrão (severidade)
    } else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const familiaVazia = filters.familia && sorted.length === 0 && !filters.busca && !filters.sinal

  return (
    <div className="space-y-4">
      <DiagnosticoSummaryCards summary={summary} activeFamilia={filters.familia} criticosActive={filters.severidade === 'critica'}
        onToggleFamilia={(fam) => patchFilters({ familia: filters.familia === fam ? null : fam })}
        onToggleCriticos={() => patchFilters({ severidade: filters.severidade === 'critica' ? null : 'critica' })} />

      <DiagnosticoToolbar filters={filters} onFiltersChange={patchFilters} computing={loading} onRefresh={onRefresh} />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertCircle size={14} className="flex-shrink-0" />
          {`Falha ao calcular (${error}).`}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-500">
          {desde ? `Vendas registradas desde ${ddmmaaaa(desde)}: sinais que pedem mais histórico só aparecem quando houver esse período. ` : 'Ainda não há pedidos gravados: os sinais de venda ficam de fora. '}
          {!podeVerValores && 'Seu acesso não inclui custos: os sinais de margem ficam de fora. '}
          A Magalu não entrega visitas, então sinais de tráfego e conversão não existem aqui.
        </p>
      )}

      {loading && (
        <div className="space-y-2 animate-fade-in">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-56 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                </div>
                <div className="hidden sm:block h-5 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <DiagnosticoTable rows={sorted} sortKey={sortKey} sortDir={sortDir} onSortChange={handleSort}
          page={page} onPageChange={setPage} onOpenEvidence={setDrawerRow} />
      )}

      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Stethoscope size={28} className="text-slate-300 mb-3" />
          {familiaVazia ? (
            <p className="text-sm font-semibold text-slate-600">{FAMILIA_CONFIG[filters.familia].emptyMessage}</p>
          ) : (rows ?? []).length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">Nenhum sinal na loja hoje. 🎉</p>
          ) : (
            <p className="text-sm text-slate-500">Nenhum produto com os filtros atuais.</p>
          )}
        </div>
      )}

      {drawerRow && <EvidenceDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />}
    </div>
  )
}
