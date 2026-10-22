import { Link } from 'react-router-dom'
import { Lock, AlertTriangle } from 'lucide-react'

/**
 * Avisos do que falta para a margem: acesso, comissão/imposto (/impostos), custo (/produtos)
 * e frete. Compartilhado por Performance, Lucratividade e Rentabilidade.
 * `comissaoCompleta`: a Magalu informou a comissão de todo item vendido (aí o % não faz falta).
 * @param {{ podeVerValores:boolean, cfg:object|null, semCusto?:number, comissaoCompleta?:boolean, loading?:boolean }} props
 */
export default function AvisoMargem({ podeVerValores, cfg, semCusto = 0, comissaoCompleta = false, freteMedido = false, loading }) {
  if (loading) return null
  if (!podeVerValores) {
    return (
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
        <Lock aria-hidden="true" size={16} className="mt-0.5 flex-shrink-0" />
        <span>Seu acesso não inclui custos e margem. Receita e unidades continuam visíveis.</span>
      </div>
    )
  }
  const semComissao = cfg?.commission_pct == null && !comissaoCompleta
  const semImposto = cfg?.tax_pct == null
  // Com frete medido na Magalu o % configurado só cobre SKU sem medição: não é aviso.
  const semFrete = cfg?.freight_pct == null && !freteMedido
  if (!semComissao && !semImposto && semCusto === 0 && !semFrete) return null
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
      <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 flex-shrink-0" />
      <ul className="space-y-1">
        {(semComissao || semImposto) && (
          <li>
            {`Sem ${[semComissao && 'comissão da Magalu', semImposto && 'alíquota de imposto'].filter(Boolean).join(' e ')}: a margem fica indisponível. `}
            <Link to="/impostos" className="font-semibold underline">Configurar em Impostos</Link>
          </li>
        )}
        {semCusto > 0 && (
          <li>
            {`${semCusto} SKU(s) vendido(s) sem custo cadastrado: margem indisponível para eles. `}
            <Link to="/produtos" className="font-semibold underline">Cadastrar custos em Produtos</Link>
          </li>
        )}
        {semFrete && !semComissao && !semImposto && (
          <li>
            {'Frete não configurado: a margem sai sem frete. '}
            <Link to="/impostos" className="font-semibold underline">Configurar</Link>
          </li>
        )}
      </ul>
    </div>
  )
}
