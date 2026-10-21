import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * Donut chart wrapper.
 * @param {object} props
 * @param {{name: string, value: number, color: string}[]} props.data
 * @param {string} [props.centerLabel] — texto grande no centro
 * @param {string} [props.centerSublabel] — texto pequeno abaixo
 * @param {number} [props.size=180] — diâmetro em px
 */
export default function DonutChart({ data, centerLabel, centerSublabel, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center text-xs text-slate-400"
        style={{ width: size, height: size }}
      >
        Sem dados
      </div>
    )
  }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E6E8DF',
              borderRadius: 12,
              fontSize: 12,
              boxShadow: '0 4px 16px -2px rgb(0 0 0 / 0.08)',
            }}
            formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && <p className="text-2xl font-black text-slate-900 tabular-nums">{centerLabel}</p>}
          {centerSublabel && <p className="text-xs text-slate-400">{centerSublabel}</p>}
        </div>
      )}
    </div>
  )
}
