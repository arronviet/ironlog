import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-semibold">
              IL
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">IronLog</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary mb-8 font-medium">
          Progressive Overload · Simplified
        </div>

        <h1 className="text-5xl sm:text-6xl font-semibold text-foreground leading-tight tracking-tight max-w-2xl">
          Track every rep.
          <br />
          <span className="text-muted-foreground font-light">
            See every gain.
          </span>
        </h1>

        <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed">
          IronLog is the workout tracker that actually shows you if you&apos;re
          getting stronger. Not a dashboard full of charts — just the data that
          matters.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/auth/register"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors text-sm"
          >
            Start tracking free
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Already have an account →
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          {[
            "Progressive Overload Detection",
            "Estimated 1RM",
            "Workout Journal",
            "Training Calendar",
            "Volume Tracking",
            "Streak Counter",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 border border-border rounded-full bg-card"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          IronLog · $9/month · Built for serious lifters
        </p>
      </footer>
    </main>
  );
}
