'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * useCountUp — animate số từ 0 lên target khi mount.
 * Dùng requestAnimationFrame để không block main thread.
 * duration mặc định 600ms — cảm giác snappy không slow.
 */
export function useCountUp(target: number | null, duration = 600): number | null {
  const [value, setValue] = useState<number | null>(null)
  const raf = useRef<number | null>(null)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (target == null) {
      setValue(null)
      return
    }

    // Reset nếu target thay đổi
    startTime.current = null
    const start = 0

    const tick = (now: number) => {
      if (startTime.current == null) startTime.current = now
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic — cảm giác tự nhiên
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(start + (target - start) * eased)

      if (progress < 1) {
        raf.current = requestAnimationFrame(tick)
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
    }
  }, [target, duration])

  return value
}