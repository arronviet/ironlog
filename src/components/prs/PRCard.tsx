'use client'

import { memo, useCallback, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown, Trash2, Edit3, X } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { usePRStore } from '@/lib/store/prs'
import { toast } from '@/hooks/useToast'
import { removeTrackedExercise, setOfficialPR, deleteOfficialPR } from '@/actions/prs'
import type { PRStats } from '@/types/prs'
import dynamic from 'next/dynamic'

const PRChart = dynamic(() => import('./PRChart'), {
  loading: () => (
    <div className="h-40 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
    </div>
  ),
  ssr: false,
})

interface PRCardProps {
  stats: PRStats
  index: number
}

export const PRCard = memo(function PRCard({ stats, index }: PRCardProps) {
  const { optimisticRemove, optimisticUpdatePR, optimisticDeletePR } = usePRStore()
  const [showChart, setShowChart] = useState(false)
  const [showPRModal, setShowPRModal] = useState(false)

  const animated1RM = useCountUp(stats.display1RM, 700)
  const display1RM = animated1RM != null ? animated1RM.toFixed(1) : '—'

  const cardRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springX = useSpring(mx, { stiffness: 300, damping: 30 })
  const springY = useSpring(my, { stiffness: 300, damping: 30 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [mx, my])

  const handleMouseLeave = useCallback(() => { mx.set(0); my.set(0) }, [mx, my])

  const handleRemove = useCallback(async () => {
    const rollback = optimisticRemove(stats.exerciseName)
    const result = await removeTrackedExercise(stats.exerciseName)
    if (result?.error) { rollback(); toast(`Không thể xóa: ${result.error}`, 'error') }
    else toast(`Đã xóa ${stats.exerciseName}`, 'success')
  }, [stats.exerciseName, optimisticRemove])

  const handleDeletePR = useCallback(async () => {
    const rollback = optimisticDeletePR(stats.exerciseName)
    const result = await deleteOfficialPR(stats.exerciseName)
    if (result?.error) { rollback(); toast('Không thể xóa PR', 'error') }
    else toast('Đã xóa Official PR', 'success')
  }, [stats.exerciseName, optimisticDeletePR])

  const GrowthBadge = () => {
    if (stats.growthPercent == null) return <span className="text-white/30 text-xs">—</span>
    const positive = stats.growthPercent > 0
    const Icon = positive ? TrendingUp : stats.growthPercent < 0 ? TrendingDown : Minus
    return (
      <span className={`flex items-center gap-1 text-xs font-medium ${
        positive ? 'text-emerald-400' : stats.growthPercent < 0 ? 'text-red-400' : 'text-white/40'
      }`}>
        <Icon size={12} />
        {positive ? '+' : ''}{stats.growthPercent}%
      </span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden group cursor-default select-none"
        style={{ willChange: 'transform' }}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: useTransform(
              [springX, springY],
              ([x, y]: number[]) =>
                `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
            ),
          }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate leading-tight">
                {stats.exerciseName}
              </h3>
              {stats.isOfficial && (
                <span className="text-[10px] text-amber-400/70 flex items-center gap-1 mt-0.5">
                  <Trophy size={9} />
                  Official PR
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => setShowPRModal(true)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white/80 transition-colors"
                aria-label="Đặt Official PR"
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={handleRemove}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                aria-label="Xóa exercise"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-white tabular-nums leading-none">
              {display1RM}
              <span className="text-sm font-normal text-white/40 ml-1">kg</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40">
                {stats.isOfficial ? 'Official PR' : 'Ước tính 1RM'}
              </span>
              <GrowthBadge />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Max KG', value: stats.maxWeight != null ? `${stats.maxWeight}kg` : '—' },
              { label: 'Max Reps', value: stats.maxReps ?? '—' },
              { label: 'Vol max', value: stats.maxVolume != null ? `${(stats.maxVolume / 1000).toFixed(1)}t` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/[0.03] rounded-xl p-2.5">
                <div className="text-xs text-white/30 mb-1">{label}</div>
                <div className="text-sm font-medium text-white/80 tabular-nums">{String(value)}</div>
              </div>
            ))}
          </div>

          {stats.previous1RM != null && (
            <div className="text-xs text-white/30 mb-3">
              PR trước: <span className="text-white/50">{stats.previous1RM} kg</span>
            </div>
          )}

          <button
            onClick={() => setShowChart(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors duration-150 w-full"
          >
            <motion.div animate={{ rotate: showChart ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} />
            </motion.div>
            {showChart ? 'Ẩn biểu đồ' : 'Xem tiến bộ'}
          </button>
        </div>

        {showChart && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="px-4 pt-3 pb-4">
              {stats.history.length > 1 ? (
                <PRChart data={stats.history} />
              ) : (
                <p className="text-xs text-white/30 text-center py-6">
                  Cần ít nhất 2 buổi tập để hiện biểu đồ
                </p>
              )}
            </div>
          </motion.div>
        )}

        {showPRModal && (
          <OfficialPRInlineForm
            stats={stats}
            onClose={() => setShowPRModal(false)}
            onOptimisticUpdate={optimisticUpdatePR}
            onOptimisticDelete={handleDeletePR}
          />
        )}
      </motion.div>
    </motion.div>
  )
})

const OfficialPRInlineForm = memo(function OfficialPRInlineForm({
  stats,
  onClose,
  onOptimisticUpdate,
  onOptimisticDelete,
}: {
  stats: PRStats
  onClose: () => void
  onOptimisticUpdate: (name: string, oneRM: number) => () => void
  onOptimisticDelete: () => void
}) {
  const [oneRM, setOneRM] = useState(String(stats.officialPR?.one_rm ?? stats.display1RM ?? ''))
  const [date, setDate] = useState(stats.officialPR?.achieved_date ?? new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(stats.officialPR?.notes ?? '')
  const [pending, setPending] = useState(false)

  const handleSave = async () => {
    const val = parseFloat(oneRM)
    if (isNaN(val) || val <= 0) { toast('Nhập 1RM hợp lệ', 'error'); return }
    setPending(true)
    const rollback = onOptimisticUpdate(stats.exerciseName, val)
    onClose()
    const result = await setOfficialPR(stats.exerciseName, val, date, notes || undefined)
    setPending(false)
    if (result?.error) { rollback(); toast('Không thể lưu PR', 'error') }
    else toast('Đã lưu Official PR 🏆', 'success')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-3 z-10"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Official PR</span>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/50">1RM (kg)</label>
        <input
          type="number"
          value={oneRM}
          onChange={e => setOneRM(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30"
          placeholder="e.g. 120.0"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/50">Ngày đạt</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-white/50">Ghi chú (tuỳ chọn)</label>
        <input
          type="text"
          value={notes ?? ''}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30"
          placeholder="Cuộc thi, cảm xúc..."
        />
      </div>

      <div className="flex gap-2 mt-1">
        {stats.officialPR && (
          <button
            onClick={onOptimisticDelete}
            className="px-3 py-2 rounded-xl text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Xóa PR
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex-1 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pending ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </motion.div>
  )
})
