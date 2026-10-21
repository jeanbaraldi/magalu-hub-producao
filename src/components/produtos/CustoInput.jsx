import { useEffect, useState } from 'react'
import { parseCusto } from '../../features/produtos/produtos.mapper'

const paraTexto = (v) => (v == null ? '' : String(v).replace('.', ','))

/**
 * Campo de custo por SKU: grava no blur ou Enter. Vazio apaga o custo.
 * Erro aparece na própria linha e o valor volta ao último salvo.
 */
export default function CustoInput({ sku, custo, onSalvar }) {
  const [texto, setTexto] = useState(paraTexto(custo))
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { setTexto(paraTexto(custo)) }, [custo])

  async function gravar() {
    const n = parseCusto(texto)
    const atual = custo ?? null
    if (n === atual || (n == null && atual == null)) { setErro(null); return }
    if (Number.isNaN(n)) {
      setErro('Custo inválido')
      setTexto(paraTexto(custo))
      return
    }
    setSalvando(true)
    try {
      await onSalvar(sku, n == null ? '' : n)
      setErro(null)
    } catch (e) {
      setErro(e.message || 'Não foi possível salvar')
      setTexto(paraTexto(custo))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-w-[110px]">
      <div className="relative">
        <span aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Custo do SKU ${sku}`}
          value={texto}
          placeholder="não cadastrado"
          disabled={salvando}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={gravar}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
          className={`w-full h-8 pl-7 pr-2 text-sm rounded-lg border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue disabled:opacity-60 ${erro ? 'border-rose-400' : 'border-slate-200'}`}
        />
      </div>
      {erro && <p role="alert" className="text-[11px] text-rose-600 mt-1">{erro}</p>}
    </div>
  )
}
