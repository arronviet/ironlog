// ============================================================
// File: src/app/prs/page.tsx  (Server Component)
// ============================================================

import { Suspense } from 'react'
import { getAllPRStats, getTrackedExercises } from '@/actions/prs'
import PRDashboard from './PRDashboard'

export const metadata = {
  title: 'Personal Records · IronLog',
}

export default async function PRsPage() {
  const [allStats, tracked] = await Promise.all([
    getAllPRStats(),
    getTrackedExercises(),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Suspense fallback={<PRSkeleton />}>
        <PRDashboard
          initialStats={allStats}
          trackedNames={tracked.map((t) => t.exercise_name)}
        />
      </Suspense>
    </div>
  )
}

function PRSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />
        ))}
      </div>
    </div>
  )
}
 