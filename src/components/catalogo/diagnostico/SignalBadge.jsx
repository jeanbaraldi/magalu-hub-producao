// Pill de um sinal, colorida pela família, com tooltip (nome + regra). Igual ao Gestor ML.
import { cn } from '../../../lib/utils'
import { DEFS_BY_CODE, FAMILIA_CONFIG } from '../../../features/catalogo/diagnostico.constants'

export default function SignalBadge({ codigo }) {
  const def = DEFS_BY_CODE[codigo]
  const fam = FAMILIA_CONFIG[def?.familia ?? 'problema']
  return (
    <span title={def ? `${def.nome} — ${def.descricao}` : codigo}
      className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap', fam.chip)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', fam.dot)} />
      {def?.nome ?? codigo}
    </span>
  )
}
