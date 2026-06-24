'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Trophy, Dumbbell } from 'lucide-react'
import { usePRStore, selectFilteredPRs } from '@/lib/store/prs'
import { PRCard } from '@/components/prs/PRCard'
import type { PRStats } from '@/types/prs'
import dynamic from 'next/dynamic'

const AddExerciseModal = dynamic(() => import('@/components/prs/AddExerciseModal'), {
  loading: () => null,
  ssr: false,
})

interface PRDashboardProps {
  initialStats: PRStats[]
}

const SORT_OPTIONS = [
  { value: 'current1RM' as const, label: '1RM' },
  { value: 'growth' as const, label: 'Tăng trưởng' },
  { value: 'name' as const, label: 'Tên' },
] satisfies { value: Parameters<typeof selectFilteredPRs>[2]; label: string }[]

export default function PRDashboard({ initialStats }: PRDashboardProps) {
  const { hydrate, items, sortBy, search, setSortBy, setSearch } = usePRStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { hydrate(initialStats) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 150)
  }

  const filteredStats = useMemo(
    () => selectFilteredPRs(items, debouncedSearch, sortBy),
    [items, debouncedSearch, sortBy],
  )

  const summary = useMemo(() => ({
    total: items.length,
    withPR: items.filter(i => i.isOfficial).length,
    avgGrowth: items.length
      ? Math.round(items.reduce((acc, i) => acc + (i.growthPercent ?? 0), 0) / items.length * 10) / 10
      : 0,
  }), [items])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex items-start justify-between mb-8 gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Trophy size={22} className="text-amber-400" />
              Personal Records
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {summary.total} bài tập · {summary.withPR} Official PR · Tăng trung bình {summary.avgGrowth}%
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                       text-sm font-medium text-white/80 hover:text-white
                       transition-all duration-150 active:scale-95"
          >
            <Plus size={15} />
            Theo dõi bài tập
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex gap-3 mb-6 flex-wrap"
        >
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm bài tập..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06]
                         rounded-xl text-sm text-white placeholder-white/25
                         focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.05] rounded-xl p-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  sortBy === opt.value ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {filteredStats.length === 0 ? (
          <EmptyState hasItems={items.length > 0} onAdd={() => setShowAddModal(true)} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredStats.map((stats, i) => (
                  <PRCard key={stats.exerciseName} stats={stats} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <AddExerciseModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-24 gap-4"
    >
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
        <Dumbbell size={28} className="text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-white/60 text-sm">
          {hasItems ? 'Không tìm thấy bài tập nào' : 'Chưa theo dõi bài tập nào'}
        </p>
        {!hasItems && (
          <button
            onClick={onAdd}
            className="mt-3 text-sm text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
          >
            Thêm bài tập đầu tiên
          </button>
        )}
      </div>
    </motion.div>
  )
}
