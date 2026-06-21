"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  getWorkoutTypeLabel,
  getWorkoutTypeBadgeClass,
  getDurationString,
  formatVolume,
  calculateVolume,
} from "@/lib/utils";
import { deleteWorkout } from "@/lib/actions/workouts";
import { useWorkoutStore } from "@/lib/store/workout";
import { Search, Dumbbell, Trash2, Check, X } from "lucide-react";

interface Props {
  workouts: any[];
}

export function HistoryClient({ workouts }: Props) {
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const addToast = useWorkoutStore((s) => s.addToast);

  const filtered = workouts.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.workout_type.toLowerCase().includes(search.toLowerCase()) ||
      w.exercises?.some((ex: any) =>
        ex.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  // Group by month
  const grouped = filtered.reduce<Record<string, any[]>>((acc, workout) => {
    const month = format(new Date(workout.started_at), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(workout);
    return acc;
  }, {});

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      try {
        await deleteWorkout(id);
        setConfirmingId(null);
        addToast({ title: `Deleted "${name}"`, variant: "default" });
      } catch {
        addToast({ title: "Failed to delete workout", variant: "destructive" });
      }
    });
  };

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

                  const isConfirming = confirmingId === workout.id;

                  return (
                    <div
                      key={workout.id}
                      className={`flex items-center gap-4 bg-card border rounded-lg px-4 py-3 transition-colors ${
                        isConfirming
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-border hover:bg-accent/30 hover:border-border/80"
                      }`}
                    >
                      {isConfirming ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              Delete &ldquo;{workout.name}&rdquo;?
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This can&apos;t be undone — all sets and notes will be lost.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(workout.id, workout.name)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-medium px-3 py-1.5 rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/workout/${workout.id}`}
                            className="flex items-center gap-4 flex-1 min-w-0"
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

                          <button
                            type="button"
                            onClick={() => setConfirmingId(workout.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            title="Delete workout"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
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
