'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface ForecastPoint {
  week_start: string
  q10: number
  q50: number
  q90: number
}

interface Props {
  data: ForecastPoint[]
}

export function ForecastChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-lagune/40">Aucune prévision disponible.</p>
  }

  const chartData = data.map((d) => ({
    week: d.week_start ? d.week_start.slice(5, 10) : '?', // MM-DD
    q10: d.q10,
    q50: d.q50,
    q90: d.q90,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1F7A4D" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1F7A4D" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#CFD9D5" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: '#0B2E3399' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#0B2E3399' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #CFD9D5' }}
          labelStyle={{ fontWeight: 600 }}
        />
        {/* Confidence band q10–q90 */}
        <Area
          type="monotone"
          dataKey="q90"
          stroke="transparent"
          fill="url(#bandGradient)"
          dot={false}
          name="Q90"
        />
        <Area
          type="monotone"
          dataKey="q10"
          stroke="transparent"
          fill="white"
          dot={false}
          name="Q10"
        />
        {/* Median line */}
        <Line
          type="monotone"
          dataKey="q50"
          stroke="#1F7A4D"
          strokeWidth={2}
          dot={false}
          name="Médiane (Q50)"
        />
        <Line
          type="monotone"
          dataKey="q10"
          stroke="#1F7A4D"
          strokeWidth={1}
          strokeDasharray="4 2"
          dot={false}
          name="Q10"
        />
        <Line
          type="monotone"
          dataKey="q90"
          stroke="#1F7A4D"
          strokeWidth={1}
          strokeDasharray="4 2"
          dot={false}
          name="Q90"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
