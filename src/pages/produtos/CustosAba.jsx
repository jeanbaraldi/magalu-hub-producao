import { useMemo, useState } from 'react'
import { RefreshCw, Upload } from 'lucide-react'
import SearchInput from '../../components/ui/SearchInput'
import ChipGroup from '../../components/magalu/ChipGroup'
import ProdutosTable from '../../components/produtos/ProdutosTable'
import ImportarCustosModal from '../../components/produtos/ImportarCustosModal'
import { useProdutosData } from '../../features/produtos/useProdutosData'
import { filtrarProdutos } from '../../features/produtos/produtos.mapper'
import { FILTROS, PAGE_SIZE, MSG_SEM_ACESSO } from '../../features/produtos/produtos.constants'

// Aba Custos de Produtos: custo por SKU, markup e importação em massa (a tela de antes).
export default function CustosAba() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [importando, setImportando] = useState(false)
  const d = useProdutosData()
  const filtrados = useMemo(() => filtrarProdutos(d.rows, { filtro, busca }), [d.rows, filtro, busca])

  return (
    <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-end gap-2">
            {d.podeVerValores && (
              <button type="button" onClick={() => setImportando(true)} disabled={d.loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <Upload aria-hidden="true" size={14} /> Importar custos
              </button>
            )}
            <button type="button" onClick={d.refetch} disabled={d.loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw aria-hidden="true" size={14} className={d.loading ? 'animate-spin' : ''} /> Atualizar
            </button>
        </div>
        {!d.loading && !d.podeVerValores && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">{MSG_SEM_ACESSO}</div>
        )}
        {d.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">Erro ao carregar produtos: {d.error}</div>
        )}
        {d.avisoVendas && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">{d.avisoVendas}</div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {d.podeVerValores && <ChipGroup ariaLabel="Custo" options={FILTROS} value={filtro} onChange={setFiltro} />}
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por SKU ou título" />
          </div>
          {d.podeVerValores && !d.loading && (
            <p className="text-sm text-slate-600"><strong>{d.resumo.comCusto}</strong> de <strong>{d.resumo.total}</strong> SKUs com custo</p>
          )}
        </div>
        {d.semSku > 0 && (
          <p className="text-xs text-slate-500">{d.semSku} item(ns) de pedido sem SKU ficaram fora das vendas de 30 dias.</p>
        )}
        <ProdutosTable key={`${filtro}|${busca}`} rows={filtrados} loading={d.loading} pageSize={PAGE_SIZE} podeVerValores={d.podeVerValores} onSalvarCusto={d.salvarCusto} />
      {d.podeVerValores && (
        <ImportarCustosModal open={importando} onClose={() => setImportando(false)} catalogo={d.catalogo} onImportar={d.importarCustos} />
      )}
    </div>
  )
}
