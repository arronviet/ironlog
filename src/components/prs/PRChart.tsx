'use client'

// ============================================================
// File: src/components/prs/PRChart.tsx
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { PRDataPoint } from '@/types/prs'

interface PRChartProps {
  history: PRDataPoint[]
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PRDataPoint & { dateLabel: string }
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-white/10 bg-[#0f0f0f]/90 p-3 text-xs backdrop-blur-md shadow-xl"
    >
      <p className="mb-2 font-medium text-white/60">{label}</p>
      <div className="space-y-1">
        <Row label="Estimated 1RM" value={`${d.estimated1RM.toFixed(1)} kg`} accent />
        <Row label="Best set" value={`${d.bestSetWeight} kg × ${d.bestSetReps} reps`} />
        <Row label="Volume" value={`${d.totalVolume} kg`} />
      </div>
    </motion.div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/30">{label}</span>
      <span className={accent ? 'font-semibold text-white' : 'text-white/60'}>{value}</span>
    </div>
  )
}

export default function PRChart({ history }: PRChartProps) {
  const data = history.map((p) => ({
    ...p,
    dateLabel: fmtDateShort(p.date),
  }))

  const min = Math.min(...data.map((d) => d.estimated1RM))
  const max = Math.max(...data.map((d) => d.estimated1RM))
  const padding = (max - min) * 0.15 || 5

  return (
    <AnimatePresence>
      <motion.div
        key="chart"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 160 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full overflow-hidden"
      >
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[min - padding, max + padding]}
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(167,139,250,0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="estimated1RM"
              stroke="#a78bfa"
              strokeWidth={1.5}
              fill="url(#prGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  )
} 
