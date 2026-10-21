import { Link } from 'react-router-dom'
import { MOTIVO_INFO } from '../../features/lucratividade/lucratividade.constants'

/** Por que o lucro de alguns SKUs não pôde ser apurado, com o caminho para resolver. */
export default function PendenciasLucro({ pendencias }) {
  if (pendencias.length === 0) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold mb-1">Lucro pendente: o que falta</p>
      <ul className="space-y-0.5">
        {pendencias.map((p) => {
          const info = MOTIVO_INFO[p.motivo]
          return (
            <li key={p.motivo}>
              {`${info?.label ?? p.motivo}: ${p.skus} SKU(s)`}
              {info?.rota && <> · <Link to={info.rota} className="underline font-semibold">resolver</Link></>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
