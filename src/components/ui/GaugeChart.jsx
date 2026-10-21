import { cn } from '../../lib/utils'

/**
 * Gauge 180° (semicírculo) com fill colorido.
 * @param {object} props
 * @param {number} props.value — 0..max
 * @param {number} [props.max=100]
 * @param {{threshold: number, color: string}[]} [props.colorStops]
 * @param {number} [props.size=200]
 * @param {React.ReactNode} [props.children] — conteúdo no centro
 */
export default function GaugeChart({
  value,
  max = 100,
  colorStops = [
    { threshold: 40, color: '#EF4444' },
    { threshold: 70, color: '#F59E0B' },
    { threshold: 85, color: '#22C55E' },
    { threshold: 100, color: '#10B981' },
  ],
  size = 200,
  children,
  className,
}) {
  const pct = Math.max(0, Math.min(1, value / max))
  const color = colorStops.find((s) => value <= s.threshold)?.color ?? '#10B981'

  // Geometria: arc de 180° (semicírculo) de (10, 90) para (190, 90) com raio 80
  const radius = 80
  const cx = 100
  const cy = 100
  const startX = cx - radius
  const startY = cy
  const endX = cx + radius
  const endY = cy

  const circumference = Math.PI * radius
  const dashArray = `${pct * circumference} ${circumference}`

  return (
    <div className={cn('relative inline-block', className)} style={{ width: size, height: size / 2 + 20 }}>
      <svg viewBox="0 0 200 110" className="w-full h-full" aria-label={`Score ${value} de ${max}`}>
        {/* track de fundo */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="#E6E8DF"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* fill colorido */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          style={{ transition: 'stroke-dasharray 600ms ease-out' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/4 flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}
