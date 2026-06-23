'use client'

// ============================================================
// File: src/app/prs/PRDashboard.tsx
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PRStats } from '@/types/prs'
import PRCard from '@/components/prs/PRCard'
import AddExerciseModal from '@/components/prs/AddExerciseModal'

interface PRDashboardProps {
  initialStats: PRStats[]
  trackedNames: string[]
}

export default function PRDashboard({ initialStats, trackedNames }: PRDashboardProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rm' | 'growth'>('rm')

  const filtered = initialStats
    .filter((s) => s.exerciseName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.exerciseName.localeCompare(b.exerciseName)
      if (sortBy === 'rm') return (b.display1RM ?? 0) - (a.display1RM ?? 0)
      if (sortBy === 'growth') return (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity)
      return 0
    })

  const totalPRs = initialStats.length
  const officialCount = initialStats.filter((s) => s.isOfficial).length
  const avgGrowth =
    initialStats.filter((s) => s.growthPercent !== null).length > 0
      ? initialStats
          .filter((s) => s.growthPercent !== null)
          .reduce((sum, s) => sum + (s.growthPercent ?? 0), 0) /
        initialStats.filter((s) => s.growthPercent !== null).length
      : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Personal Records</h1>
          <p className="mt-1 text-xs text-white/30">Theo dõi tiến bộ sức mạnh của bạn</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/70 transition-all hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm exercise
        </button>
      </motion.div>

      {/* Summary strip */}
      {totalPRs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          <SummaryCard label="Đang theo dõi" value={totalPRs.toString()} index={0} />
          <SummaryCard label="Official PRs" value={officialCount.toString()} accent="amber" index={1} />
          <SummaryCard
            label="Avg growth"
            value={avgGrowth !== null ? `${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)}%` : '—'}
            accent={avgGrowth !== null && avgGrowth >= 0 ? 'emerald' : 'red'}
            index={2}
          />
        </motion.div>
      )}

      {/* Controls */}
      {totalPRs > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-5 flex flex-wrap items-center gap-3"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm exercise..."
              className="w-full bg-transparent text-xs text-white/70 placeholder-white/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {(['rm', 'growth', 'name'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                  sortBy === opt
                    ? 'bg-white/[0.08] text-white/80'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {opt === 'rm' ? '1RM' : opt === 'growth' ? 'Tăng trưởng' : 'Tên'}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {totalPRs === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white/60">Chưa có PR nào</h2>
          <p className="mt-1.5 max-w-xs text-xs text-white/25">
            Thêm exercise để bắt đầu theo dõi Personal Records từ lịch sử tập của bạn.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-white/60 transition-all hover:border-white/[0.15] hover:text-white/80"
          >
            Thêm exercise đầu tiên
          </button>
        </motion.div>
      )}

      {/* No results */}
      {totalPRs > 0 && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-xs text-white/30"
        >
          Không tìm thấy &ldquo;{search}&rdquo;
        </motion.div>
      )}

      {/* PR Grid — stagger cards */}
      {filtered.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((stats, i) => (
              <motion.div
                key={stats.exerciseName}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.07,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <PRCard stats={stats} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddExerciseModal
            trackedNames={trackedNames}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
  index,
}: {
  label: string
  value: string
  accent?: 'amber' | 'emerald' | 'red'
  index: number
}) {
  const accentColor = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.06, ease: 'easeOut' }}
      className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
    >
      <p className={`text-lg font-bold ${accent ? accentColor[accent] : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-white/25">{label}</p>
    </motion.div>
  )
}
