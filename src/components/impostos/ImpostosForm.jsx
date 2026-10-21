import { useState } from 'react'
import Button from '../ui/Button'
import { REGIMES, TEXTO_COMISSAO, TEXTO_FRETE } from '../../features/impostos/impostos.constants'
import { cfgParaForm, validarForm, aliquotaSugerida, descreverPct } from '../../features/impostos/impostos.mapper'
import { dataHora } from '../magalu/formatos'

function CampoPct({ id, label, valor, onChange, erro, ajuda, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative mt-1 max-w-[180px]">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={valor}
          placeholder={placeholder ?? 'não informado'}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!erro}
          aria-describedby={ajuda ? `${id}-ajuda` : undefined}
          className={`w-full h-10 pl-3 pr-8 rounded-xl border text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mg-blue ${erro ? 'border-rose-400' : 'border-slate-200'}`}
        />
        <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
      </div>
      {erro && <p role="alert" className="text-xs text-rose-600 mt-1">{erro}</p>}
      {ajuda && <p id={`${id}-ajuda`} className="text-xs text-slate-500 mt-1 max-w-xl">{ajuda}</p>}
    </div>
  )
}

/** Formulário da configuração financeira. Remontar (key) quando a loja ou a config mudar. */
export default function ImpostosForm({ cfg, onSalvar }) {
  const [form, setForm] = useState(() => cfgParaForm(cfg))
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState(null)

  const mudar = (campo) => (v) => { setForm((f) => ({ ...f, [campo]: v })); setMsg(null) }

  function escolherRegime(regime) {
    const sug = aliquotaSugerida(regime)
    setForm((f) => ({ ...f, regime, imposto: sug == null ? f.imposto : String(sug).replace('.', ',') }))
    setMsg(null)
  }

  async function salvar(e) {
    e.preventDefault()
    const r = validarForm(form)
    setErros(r.erros)
    if (!r.campos) return
    setSalvando(true)
    try {
      await onSalvar(r.campos)
      setMsg({ tipo: 'ok', texto: 'Configuração salva.' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: `Não foi possível salvar: ${err.message}` })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">Regime tributário</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {REGIMES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={form.regime === r.value}
              onClick={() => escolherRegime(r.value)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${form.regime === r.value ? 'bg-mg-blue border-mg-blue text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {r.label}{r.aliquota != null && <span className="ml-1 font-normal opacity-80">{String(r.aliquota).replace('.', ',')}%</span>}
            </button>
          ))}
        </div>
        {!form.regime && <p className="text-xs text-slate-500 mt-1">Regime não informado.</p>}
        {erros.regime && <p role="alert" className="text-xs text-rose-600 mt-1">{erros.regime}</p>}
      </fieldset>

      <CampoPct id="imposto" label="Alíquota efetiva de imposto" valor={form.imposto} onChange={mudar('imposto')} erro={erros.imposto} ajuda="Escolher o regime sugere a alíquota; ajuste para a alíquota real da sua empresa." />
      <CampoPct id="comissao" label="Comissão da Magalu" valor={form.comissao} onChange={mudar('comissao')} erro={erros.comissao} ajuda={TEXTO_COMISSAO} />
      <CampoPct id="frete" label="Frete que a loja assume (opcional)" valor={form.frete} onChange={mudar('frete')} erro={erros.frete} ajuda={TEXTO_FRETE} />

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <Button type="submit" loading={salvando}>Salvar configuração</Button>
        {msg && <p role="status" className={`text-sm ${msg.tipo === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.texto}</p>}
      </div>

      <div className="text-xs text-slate-500 space-y-0.5">
        <p>Salvo hoje: imposto {descreverPct(cfg?.tax_pct)} · comissão {descreverPct(cfg?.commission_pct)} · frete {descreverPct(cfg?.freight_pct)}</p>
        {cfg?.updated_at && <p>Última alteração: {dataHora(cfg.updated_at)}</p>}
      </div>
    </form>
  )
}
