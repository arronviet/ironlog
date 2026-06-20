"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  getWorkoutTypeLabel,
  getWorkoutTypeBadgeClass,
  getDurationString,
  formatVolume,
  calculateVolume,
} from "@/lib/utils";
import { Search, Dumbbell } from "lucide-react";

interface Props {
  workouts: any[];
}

export function HistoryClient({ workouts }: Props) {
  const [search, setSearch] = useState("");

  const filtered = workouts.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.workout_type.toLowerCase().includes(search.toLowerCase()) ||
      w.exercises?.some((ex: any) =>
        ex.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  // Group by month
  const grouped = filtered.reduce(
    (acc, workout) => {
      const month = format(new Date(workout.started_at), "MMMM yyyy");
      if (!acc[month]) acc[month] = [];
      acc[month].push(workout);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workouts.length} sessions logged
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workouts or exercises..."
          className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Workout groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No workouts found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthWorkouts]) => (
            <div key={month}>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {month} · {monthWorkouts.length} sessions
              </h2>
              <div className="space-y-2">
                {monthWorkouts.map((workout) => {
                  const totalVolume =
                    workout.exercises?.reduce(
                      (acc: number, ex: any) =>
                        acc +
                        calculateVolume(
                          ex.exercise_sets?.map((s: any) => ({
                            weight_kg: s.weight_kg,
                            reps: s.reps,
                          })) ?? []
                        ),
                      0
                    ) ?? 0;

                  const exercises =
                    workout.exercises
                      ?.slice(0, 3)
                      .map((ex: any) => ex.name)
                      .join(", ") +
                    (workout.exercises?.length > 3
                      ? ` +${workout.exercises.length - 3}`
                      : "");

                  return (
                    <Link
                      key={workout.id}
                      href={`/workout/${workout.id}`}
                      className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-3 hover:bg-accent/30 hover:border-border/80 transition-colors"
                    >
                      <div className="text-center shrink-0 w-10">
                        <div className="text-sm font-semibold text-foreground tabular-nums">
                          {format(new Date(workout.started_at), "d")}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {format(new Date(workout.started_at), "EEE")}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getWorkoutTypeBadgeClass(workout.workout_type)}`}
                          >
                            {getWorkoutTypeLabel(workout.workout_type)}
                          </span>
                          <span className="text-sm font-medium text-foreground truncate">
                            {workout.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {exercises}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-xs text-muted-foreground">
                        {workout.duration_minutes && (
                          <div>{getDurationString(workout.duration_minutes)}</div>
                        )}
                        <div>{formatVolume(totalVolume)}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
