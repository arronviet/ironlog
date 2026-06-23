'use client'

// ============================================================
// File: src/components/prs/PRCard.tsx
// ============================================================

import { useState } from 'react'
import type { PRStats } from '@/types/prs'
import { deleteOfficialPR, removeTrackedExercise } from '@/actions/prs'
import OfficialPRModal from './OfficialPRModal'
import PRChart from './PRChart'

interface PRCardProps {
  stats: PRStats
}

function fmt1RM(val: number | null): string {
  if (val === null) return '—'
  return `${val.toFixed(1)} kg`
}

function fmtGrowth(val: number | null): string {
  if (val === null) return '—'
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(1)}%`
}

function fmtDate(val: string | null): string {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function PRCard({ stats }: PRCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showOfficialModal, setShowOfficialModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const growthPositive = (stats.growthPercent ?? 0) >= 0

  async function handleRemoveOfficial() {
    if (!stats.officialPR) return
    setLoading(true)
    await deleteOfficialPR({ id: stats.officialPR.id })
    setLoading(false)
  }

  async function handleRemoveTracked() {
    setLoading(true)
    await removeTrackedExercise(stats.exerciseName)
    setLoading(false)
  }

  return (
    <>
      <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
        {/* Official PR badge */}
        {stats.isOfficial && (
          <div className="absolute -top-px left-4 h-px w-16 bg-gradient-to-r from-amber-400/80 to-transparent" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white/90">
                {stats.exerciseName}
              </h3>
              {stats.isOfficial && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                  Official
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-white/30">
              {stats.history.length} sessions tracked
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemoveTracked}
            disabled={loading}
            className="rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/[0.06] hover:text-white/50 group-hover:opacity-100"
            title="Bỏ theo dõi"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main 1RM display */}
        <div className="px-5 pb-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tracking-tight text-white">
              {fmt1RM(stats.display1RM)}
            </span>
            {stats.growthPercent !== null && (
              <span
                className={`mb-1 text-sm font-medium ${
                  growthPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {fmtGrowth(stats.growthPercent)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-white/30">
            Estimated 1RM · PR ngày {fmtDate(stats.prDate)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="mx-5 mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <StatCell label="Max Weight" value={stats.maxWeight ? `${stats.maxWeight} kg` : '—'} />
          <StatCell label="Max Reps" value={stats.maxReps?.toString() ?? '—'} />
          <StatCell label="Max Volume" value={stats.maxVolume ? `${stats.maxVolume} kg` : '—'} />
        </div>

        {/* Previous PR */}
        {stats.previous1RM !== null && (
          <div className="mx-5 mb-4 flex items-center justify-between text-[11px]">
            <span className="text-white/30">Previous PR</span>
            <span className="font-medium text-white/50">{fmt1RM(stats.previous1RM)}</span>
          </div>
        )}

        {/* Chart toggle */}
        {stats.history.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between border-t border-white/[0.05] px-5 py-3 text-[11px] text-white/30 transition-colors hover:text-white/50"
          >
            <span>{expanded ? 'Ẩn biểu đồ' : 'Xem tiến bộ'}</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Expanded chart */}
        {expanded && stats.history.length > 1 && (
          <div className="border-t border-white/[0.05] px-2 pb-3 pt-2">
            <PRChart history={stats.history} />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-white/[0.05] px-5 py-3">
          <button
            onClick={() => setShowOfficialModal(true)}
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-[11px] font-medium text-white/50 transition-all hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
          >
            {stats.officialPR ? 'Sửa Official PR' : 'Đặt Official PR'}
          </button>
          {stats.officialPR && (
            <button
              onClick={handleRemoveOfficial}
              disabled={loading}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-red-400/60 transition-all hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {showOfficialModal && (
        <OfficialPRModal
          exerciseName={stats.exerciseName}
          currentOfficial={stats.officialPR}
          onClose={() => setShowOfficialModal(false)}
        />
      )}
    </>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-semibold text-white/70">{value}</span>
      <span className="text-[10px] text-white/25">{label}</span>
    </div>
  )
}
