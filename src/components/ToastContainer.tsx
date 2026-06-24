'use client'

import { useToastState } from '@/hooks/useToast'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info } from 'lucide-react'

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error: <XCircle size={16} className="text-red-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
}

export function ToastContainer() {
  const toasts = useToastState()

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                       bg-white/[0.07] backdrop-blur-md border border-white/[0.1]
                       text-sm text-white shadow-xl pointer-events-auto"
          >
            {icons[t.type]}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
