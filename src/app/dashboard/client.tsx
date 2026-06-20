"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  getWorkoutTypeLabel,
  getWorkoutTypeBadgeClass,
  getDurationString,
  formatVolume,
  getStreakEmoji,
} from "@/lib/utils";
import { Plus, Flame, TrendingUp, Dumbbell, Calendar } from "lucide-react";
import type { UserStats } from "@/types";

interface Props {
  workouts: any[];
  stats: UserStats | null;
}

export function DashboardClient({ workouts, stats }: Props) {
  const greeting = getGreeting();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats?.current_streak ? (
              <>
                {stats.current_streak}-day streak{" "}
                {getStreakEmoji(stats.current_streak)}
              </>
            ) : (
              "Ready for your next session?"
            )}
          </p>
        </div>
        <Link
          href="/workout/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log workout
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Total workouts"
          value={stats?.total_workouts ?? 0}
          icon={<Dumbbell className="w-4 h-4" />}
        />
        <StatCard
          label="Current streak"
          value={`${stats?.current_streak ?? 0}d`}
          icon={<Flame className="w-4 h-4 text-orange-400" />}
          highlight={!!stats?.current_streak}
        />
        <StatCard
          label="This month"
          value={stats?.workouts_this_month ?? 0}
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard
          label="Total volume"
          value={formatVolume(stats?.total_volume_kg ?? 0)}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Recent workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Recent sessions</h2>
          <Link
            href="/history"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>

        {workouts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => (
              <WorkoutRow key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div
        className={`text-2xl font-semibold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}

function WorkoutRow({ workout }: { workout: any }) {
  const exerciseCount = workout.exercises?.length ?? 0;
  const totalSets =
    workout.exercises?.reduce(
      (acc: number, ex: any) => acc + (ex.exercise_sets?.length ?? 0),
      0
    ) ?? 0;

  const volume =
    workout.exercises?.reduce((acc: number, ex: any) => {
      return (
        acc +
        (ex.exercise_sets?.reduce(
          (s: number, set: any) => s + set.weight_kg * set.reps,
          0
        ) ?? 0)
      );
    }, 0) ?? 0;

  return (
    <Link
      href={`/workout/${workout.id}`}
      className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-3 hover:border-border/80 hover:bg-accent/30 transition-colors group"
    >
      {/* Type badge */}
      <span
        className={`text-[11px] font-medium px-2 py-1 rounded shrink-0 ${getWorkoutTypeBadgeClass(workout.workout_type)}`}
      >
        {getWorkoutTypeLabel(workout.workout_type)}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {workout.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {exerciseCount} exercises · {totalSets} sets ·{" "}
          {formatVolume(volume)} volume
        </p>
      </div>

      {/* Meta */}
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(workout.started_at), {
            addSuffix: true,
          })}
        </p>
        {workout.duration_minutes && (
          <p className="text-xs text-muted-foreground">
            {getDurationString(workout.duration_minutes)}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">
        No workouts yet
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Log your first session to start tracking progress
      </p>
      <Link
        href="/workout/new"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Log first workout
      </Link>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
