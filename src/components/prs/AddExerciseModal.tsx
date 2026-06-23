'use client'

// ============================================================
// File: src/components/prs/AddExerciseModal.tsx
// ============================================================

import { useState, useTransition } from 'react'
import { addTrackedExercise, getAvailableExercises } from '@/actions/prs'
import { POPULAR_EXERCISES } from '@/types/prs'

interface AddExerciseModalProps {
  trackedNames: string[]   // exercises đang track để không hiện trùng
  onClose: () => void
}

export default function AddExerciseModal({ trackedNames, onClose }: AddExerciseModalProps) {
  const [query, setQuery] = useState('')
  const [available, setAvailable] = useState<string[]>([])
  const [loadedAvailable, setLoadedAvailable] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Lazy load available exercises khi modal mở
  async function loadAvailable() {
    if (loadedAvailable) return
    const list = await getAvailableExercises()
    setAvailable(list)
    setLoadedAvailable(true)
  }

  // Suggestions: popular + available từ history, loại bỏ đã track
  const trackedSet = new Set(trackedNames.map((n) => n.toLowerCase()))

  const allSuggestions = [
    ...POPULAR_EXERCISES,
    ...available.filter((e) => !POPULAR_EXERCISES.includes(e as any)),
  ].filter((e) => !trackedSet.has(e.toLowerCase()))

  const filtered = query
    ? allSuggestions.filter((e) => e.toLowerCase().includes(query.toLowerCase()))
    : allSuggestions

  async function handleAdd(name: string) {
    setError(null)
    startTransition(async () => {
      const result = await addTrackedExercise({ exerciseName: name })
      if (result.success) {
        onClose()
      } else {
        setError(result.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  function handleCustomAdd() {
    const trimmed = query.trim()
    if (!trimmed) return
    handleAdd(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl">
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Theo dõi exercise</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={loadAvailable}
              placeholder="Tìm hoặc nhập tên bài tập..."
              className="w-full bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto px-5 py-3">
          {filtered.length === 0 && query ? (
            <button
              onClick={handleCustomAdd}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/[0.08] px-3 py-3 text-xs text-white/40 transition-colors hover:border-white/[0.15] hover:text-white/60"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Thêm &ldquo;{query}&rdquo;
            </button>
          ) : (
            <div className="space-y-0.5">
              {filtered.slice(0, 20).map((name) => (
                <button
                  key={name}
                  onClick={() => handleAdd(name)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white/90"
                >
                  <span>{name}</span>
                  <svg className="h-3.5 w-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="px-5 pb-3 text-[11px] text-red-400">{error}</p>
        )}

        <div className="border-t border-white/[0.05] px-5 py-3">
          <p className="text-[10px] text-white/20">
            Nhập tên bất kỳ và nhấn Enter để theo dõi exercise tuỳ chỉnh
          </p>
        </div>
      </div>
    </div>
  ) 
}
 