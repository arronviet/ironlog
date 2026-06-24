'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

// ─── Global singleton để dùng được ở bất kỳ đâu (không cần Provider) ────────
let _listeners: Array<(t: Toast) => void> = []
let _id = 0

export function toast(message: string, type: ToastType = 'info') {
  const t: Toast = { id: ++_id, message, type }
  _listeners.forEach(l => l(t))
}

// ─── Hook để mount ToastContainer ────────────────────────────────────────────
export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const add = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t])
    // Auto-dismiss sau 3s
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id))
      timers.current.delete(t.id)
    }, 3000)
    timers.current.set(t.id, timer)
  }, [])

  useEffect(() => {
    _listeners.push(add)
    return () => {
      _listeners = _listeners.filter(l => l !== add)
      timers.current.forEach(clearTimeout)
    }
  }, [add])

  return toasts
}