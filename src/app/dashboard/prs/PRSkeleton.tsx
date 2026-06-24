// ─── Skeleton placeholder khi data đang load ─────────────────────────────────
// Dùng CSS animation thay vì JS để không block main thread
// Width/height match layout thật → zero layout shift khi data load xong

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`bg-white/[0.04] rounded-xl animate-pulse ${className ?? ''}`}
    />
  )
}

function PRCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-4 w-16" />
      </div>
      {/* 1RM */}
      <div className="space-y-1">
        <SkeletonBox className="h-8 w-24" />
        <SkeletonBox className="h-3 w-20" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <SkeletonBox className="h-12 rounded-xl" />
        <SkeletonBox className="h-12 rounded-xl" />
        <SkeletonBox className="h-12 rounded-xl" />
      </div>
      {/* Chart toggle */}
      <SkeletonBox className="h-3 w-20" />
    </div>
  )
}

export function PRSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <SkeletonBox className="h-7 w-48" />
            <SkeletonBox className="h-4 w-64" />
          </div>
          <SkeletonBox className="h-10 w-36 rounded-xl" />
        </div>
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <SkeletonBox className="h-10 flex-1 rounded-xl" />
          <SkeletonBox className="h-10 w-48 rounded-xl" />
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PRCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
