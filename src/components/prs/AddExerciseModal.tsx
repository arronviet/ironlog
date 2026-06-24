'use client'

import { memo, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Search, Loader2 } from 'lucide-react'
import { getAvailableExercises, addTrackedExercise } from '@/actions/prs'
import { usePRStore } from '@/lib/store/prs'
import { toast } from '@/hooks/useToast'

interface Props {
  onClose: () => void
}

const AddExerciseModal = memo(function AddExerciseModal({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { items } = usePRStore()
  const tracked = new Set(items.map(i => i.exerciseName))

  // Focus input khi modal mở
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounced search gợi ý
  const handleQuery = useCallback((val: string) => {
    setQuery(val)
    if (debounce.current) clearTimeout(debounce.current)
    if (!val.trim()) {
      setSuggestions([])
      return
    }
    debounce.current = setTimeout(async () => {
      setIsSearching(true)
      const results = await getAvailableExercises(val)
      setSuggestions(results)
      setIsSearching(false)
    }, 200) // 200ms debounce — nhanh hơn 300ms tiêu chuẩn, ổn với Supabase
  }, [])

  const handleAdd = useCallback(
    async (name: string) => {
      if (tracked.has(name)) {
        toast(`${name} đã được theo dõi`, 'info')
        return
      }
      // Optimistic: thêm empty stats ngay lập tức
      // Server action + revalidate sẽ cập nhật sau
      startTransition(async () => {
        const result = await addTrackedExercise(name)
        if (result?.error) {
          toast(`Không thể thêm: ${result.error}`, 'error')
        } else {
          toast(`Đã thêm ${name}`, 'success')
          onClose()
        }
      })
    },
    [tracked, onClose],
  )

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && query.trim() && suggestions.length === 0) {
        handleAdd(query.trim())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [query, suggestions, onClose, handleAdd])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   w-full max-w-md bg-[#111] border border-white/[0.08] rounded-2xl
                   shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Theo dõi bài tập mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            {isSearching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQuery(e.target.value)}
              placeholder="Tìm hoặc nhập tên bài tập..."
              className="w-full pl-9 pr-9 py-2.5 bg-white/[0.05] border border-white/[0.08]
                         rounded-xl text-sm text-white placeholder-white/25
                         focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ul className="mt-2 space-y-0.5 max-h-56 overflow-y-auto">
              {suggestions.map(s => (
                <li key={s}>
                  <button
                    onClick={() => handleAdd(s)}
                    disabled={isPending}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors
                      flex items-center justify-between group
                      ${tracked.has(s)
                        ? 'text-white/25 cursor-default'
                        : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                      }`}
                  >
                    <span>{s}</span>
                    {tracked.has(s) ? (
                      <span className="text-xs text-white/20">Đã theo dõi</span>
                    ) : (
                      <Plus size={13} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Custom exercise */}
          {query.trim() && suggestions.length === 0 && !isSearching && (
            <button
              onClick={() => handleAdd(query.trim())}
              disabled={isPending}
              className="mt-2 w-full flex items-center gap-2 px-4 py-3 rounded-xl
                         bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12]
                         text-sm text-white/70 hover:text-white transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              Thêm "{query.trim()}"
              <span className="ml-auto text-xs text-white/30">Enter</span>
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
})

export default AddExerciseModal
