'use client'

import { memo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PRDataPoint } from '@/types/prs'

interface PRChartProps {
  data: PRDataPoint[]
}

const PRChart = memo(function PRChart({ data }: PRChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="grad1rm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
          tickLine={false}
          axisLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
          itemStyle={{ color: '#a78bfa' }}
          formatter={(value: number) => [`${value.toFixed(1)} kg`, '1RM ước tính']}
        />
        <Area
          type="monotone"
          dataKey="estimated1RM"
          stroke="#a78bfa"
          strokeWidth={1.5}
          fill="url(#grad1rm)"
          dot={false}
          activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

export default PRChart
