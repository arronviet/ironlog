'use client'

// ============================================================
// File: src/components/prs/OfficialPRModal.tsx
// ============================================================

import { useRef, useState, useTransition } from 'react'
import type { PROfficialRecord } from '@/types/prs'
import { setOfficialPR } from '@/actions/prs'

interface OfficialPRModalProps {
  exerciseName: string
  currentOfficial: PROfficialRecord | null
  onClose: () => void
}

export default function OfficialPRModal({
  exerciseName,
  currentOfficial,
  onClose,
}: OfficialPRModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const oneRMRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Default values từ existing official PR
  const defaultDate = currentOfficial?.achieved_date ?? new Date().toISOString().split('T')[0]
  const defaultOneRM = currentOfficial?.one_rm?.toString() ?? ''
  const defaultNotes = currentOfficial?.notes ?? ''

  function handleSubmit() {
    const oneRM = parseFloat(oneRMRef.current?.value ?? '')
    const achievedDate = dateRef.current?.value ?? ''
    const notes = notesRef.current?.value ?? ''

    if (isNaN(oneRM) || oneRM <= 0) {
      setError('Vui lòng nhập 1RM hợp lệ (kg)')
      return
    }
    if (!achievedDate) {
      setError('Vui lòng chọn ngày đạt PR')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await setOfficialPR({
        exerciseName,
        oneRM,
        achievedDate,
        notes: notes || undefined,
      })
      if (result.success) {
        onClose()
      } else {
        setError(result.error ?? 'Có lỗi xảy ra')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111111] p-6 shadow-2xl">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Đặt Official PR</h2>
            <p className="mt-0.5 text-[11px] text-white/35">{exerciseName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <Field label="1RM (kg)">
            <input
              ref={oneRMRef}
              type="number"
              step="0.5"
              min="0"
              defaultValue={defaultOneRM}
              placeholder="e.g. 120"
              className="input-base"
            />
          </Field>

          <Field label="Ngày đạt PR">
            <input
              ref={dateRef}
              type="date"
              defaultValue={defaultDate}
              className="input-base"
            />
          </Field>

          <Field label="Ghi chú (tuỳ chọn)">
            <textarea
              ref={notesRef}
              defaultValue={defaultNotes}
              placeholder="Competition lift, raw, belt only..."
              rows={2}
              className="input-base resize-none"
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-[11px] text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-xs font-medium text-white/40 transition-colors hover:border-white/[0.15] hover:text-white/60"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-xl bg-amber-400/90 py-2.5 text-xs font-semibold text-black transition-all hover:bg-amber-400 disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : 'Lưu PR'}
          </button>
        </div>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.85);
          outline: none;
          transition: border-color 0.15s;
          color-scheme: dark;
        }
        .input-base::placeholder { color: rgba(255,255,255,0.2); }
        .input-base:focus { border-color: rgba(251,191,36,0.35); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-white/35">{label}</label>
      {children}
    </div>
  )
}
