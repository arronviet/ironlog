import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastContainer } from '@/components/ToastContainer'

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// - Auth guard
// - Sidebar
// - ToastContainer (global, mount 1 lần duy nhất)
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {/* Toast phải mount ở layout (không ở page) để persist khi navigate */}
      <ToastContainer />
    </div>
  )
}
