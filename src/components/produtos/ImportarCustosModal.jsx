import { useMemo, useState } from 'react'
import { Upload } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { brl } from '../magalu/formatos'
import { parseImportacao } from '../../features/produtos/produtos.mapper'

/** Importação em massa "SKU;custo": prévia antes de gravar, confirmação explícita. */
export default function ImportarCustosModal({ open, onClose, catalogo, onImportar }) {
  const [texto, setTexto] = useState('')
  const [etapa, setEtapa] = useState('editar') // editar | previa | resultado
  const [gravando, setGravando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const previa = useMemo(() => parseImportacao(texto, catalogo), [texto, catalogo])

  function fechar() {
    setTexto(''); setEtapa('editar'); setResultado(null)
    onClose()
  }

  async function confirmar() {
    setGravando(true)
    try {
      setResultado(await onImportar(previa.validas))
      setEtapa('resultado')
    } finally {
      setGravando(false)
    }
  }

  return (
    <Modal open={open} onClose={gravando ? undefined : fechar} size="lg">
      <Modal.Header icon={Upload} iconColor="text-white" title="Importar custos" subtitle="Uma linha por SKU, no formato SKU;custo" onClose={gravando ? undefined : fechar} />
      <Modal.Body className="space-y-4">
        {etapa === 'editar' && (
          <>
            <label htmlFor="importar-custos" className="text-sm font-medium text-slate-700">Cole as linhas</label>
            <textarea
              id="importar-custos"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={10}
              placeholder={'SKU-001;12,50\nSKU-002;8,90'}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue"
            />
            <p className="text-xs text-slate-500">Também aceita tabulação no lugar do ponto e vírgula (colado de planilha). Linhas vazias são ignoradas.</p>
          </>
        )}
        {etapa === 'previa' && (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-emerald-700">{previa.validas.length} SKU(s) do catálogo serão gravados</h3>
              {previa.validas.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
                  {previa.validas.map((l) => (
                    <li key={l.sku} className="flex justify-between px-3 py-1.5"><span className="font-mono">{l.sku}</span><span>{brl(l.custo)}</span></li>
                  ))}
                </ul>
              )}
            </section>
            {previa.foraDoCatalogo.length > 0 && (
              <section>
                <h3 className="font-semibold text-amber-700">{previa.foraDoCatalogo.length} SKU(s) não estão no catálogo sincronizado e serão ignorados</h3>
                <p className="mt-1 text-xs text-slate-600 font-mono break-words">{previa.foraDoCatalogo.map((l) => l.sku).join(', ')}</p>
              </section>
            )}
            {previa.invalidas.length > 0 && (
              <section>
                <h3 className="font-semibold text-rose-700">{previa.invalidas.length} linha(s) inválida(s)</h3>
                <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
                  {previa.invalidas.map((l) => <li key={`${l.linha}-${l.texto}`}>Linha {l.linha}: <span className="font-mono">{l.texto}</span> — {l.motivo}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
        {etapa === 'resultado' && resultado && (
          <div className="text-sm space-y-2">
            <p className="text-emerald-700 font-semibold">{resultado.ok} custo(s) gravado(s).</p>
            {resultado.falhas.length > 0 && (
              <>
                <p className="text-rose-700 font-semibold">{resultado.falhas.length} não foram gravados:</p>
                <ul className="text-xs text-slate-600 space-y-0.5">
                  {resultado.falhas.map((f) => <li key={f.sku}><span className="font-mono">{f.sku}</span>: {f.erro}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {etapa === 'editar' && (
          <>
            <Button variant="secondary" onClick={fechar}>Cancelar</Button>
            <Button onClick={() => setEtapa('previa')} disabled={!texto.trim()}>Ver prévia</Button>
          </>
        )}
        {etapa === 'previa' && (
          <>
            <Button variant="secondary" onClick={() => setEtapa('editar')} disabled={gravando}>Voltar</Button>
            <Button onClick={confirmar} loading={gravando} disabled={previa.validas.length === 0}>Gravar {previa.validas.length} custo(s)</Button>
          </>
        )}
        {etapa === 'resultado' && <Button onClick={fechar}>Fechar</Button>}
      </Modal.Footer>
    </Modal>
  )
}
