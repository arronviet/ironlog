export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-8 w-40 rounded bg-zinc-800 mb-8"/>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded bg-zinc-800"/>
        ))}
      </div>

      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded bg-zinc-800"/>
        ))}
      </div>
    </div>
  );
} 