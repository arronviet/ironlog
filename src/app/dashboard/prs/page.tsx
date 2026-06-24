import { Suspense } from 'react'
import { getAllPRStats } from '@/actions/prs'
import PRDashboard from './PRDashboard'
import { PRSkeleton } from './PRSkeleton'

export const metadata = {
  title: 'Personal Records · IronLog',
}

export default async function PRsPage() {
  return (
    <Suspense fallback={<PRSkeleton />}>
      <PRsContent />
    </Suspense>
  )
}

async function PRsContent() {
  const stats = await getAllPRStats()
  return <PRDashboard initialStats={stats} />
}
