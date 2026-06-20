"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  getWorkoutTypeLabel,
  getWorkoutTypeBadgeClass,
  getDurationString,
  formatVolume,
  estimate1RM,
  calculateVolume,
  getTrendIcon,
} from "@/lib/utils";
import { ArrowLeft, Zap } from "lucide-react";
import type { ProgressComparison } from "@/types";

interface Props {
  workout: any;
  progressByExercise: Record<string, ProgressComparison | null>;
}

export function WorkoutDetail({ workout, progressByExercise }: Props) {
  const totalVolume = workout.exercises?.reduce(
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

  const totalSets =
    workout.exercises?.reduce(
      (acc: number, ex: any) => acc + (ex.exercise_sets?.length ?? 0),
      0
    ) ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${getWorkoutTypeBadgeClass(workout.workout_type)}`}
          >
            {getWorkoutTypeLabel(workout.workout_type)}
          </span>
          {workout.energy_level && (
            <span className="text-xs text-muted-foreground">
              Energy {workout.energy_level}/5
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{workout.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(workout.started_at), "EEEE, MMMM d, yyyy")}
          {workout.duration_minutes && ` · ${getDurationString(workout.duration_minutes)}`}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {workout.exercises?.length ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Exercises</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold tabular-nums text-foreground">{totalSets}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Total sets</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {formatVolume(totalVolume)}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Volume</div>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Session notes</p>
          <p className="text-sm text-foreground leading-relaxed">{workout.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises
          ?.sort((a: any, b: any) => a.order_index - b.order_index)
          .map((exercise: any) => (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              progress={progressByExercise[exercise.name] ?? null}
            />
          ))}
      </div>
    </div>
  );
}

function ExerciseBlock({
  exercise,
  progress,
}: {
  exercise: any;
  progress: ProgressComparison | null;
}) {
  const sets = exercise.exercise_sets ?? [];
  const volume = calculateVolume(sets.map((s: any) => ({ weight_kg: s.weight_kg, reps: s.reps })));
  const bestSet = sets.reduce(
    (best: any, s: any) =>
      !best ||
      s.weight_kg > best.weight_kg ||
      (s.weight_kg === best.weight_kg && s.reps > best.reps)
        ? s
        : best,
    null
  );
  const e1rm = bestSet ? estimate1RM(bestSet.weight_kg, bestSet.reps) : 0;
  const totalReps = sets.reduce((acc: number, s: any) => acc + s.reps, 0);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Exercise header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{exercise.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span>{totalReps} reps</span>
          <span>{formatVolume(volume)}</span>
          {e1rm > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {e1rm}kg e1RM
            </span>
          )}
        </div>
      </div>

      {/* Progressive overload comparison */}
      {progress && (
        <div className="px-4 py-2.5 bg-secondary/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress.trend === "new" ? (
              <span className="badge-new">
                {getTrendIcon("new")} First time logged
              </span>
            ) : progress.trend === "up" ? (
              <span className="badge-up">
                {getTrendIcon("up")}{" "}
                {progress.weight_change > 0
                  ? `+${progress.weight_change}kg`
                  : `+${progress.reps_change} reps`}{" "}
                Progress
              </span>
            ) : progress.trend === "down" ? (
              <span className="badge-down">
                {getTrendIcon("down")} Performance drop
              </span>
            ) : (
              <span className="badge-same">{getTrendIcon("same")} Same as last time</span>
            )}
          </div>
          {progress.previous && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Last: {progress.previous.weight}kg × {progress.previous.reps}
            </span>
          )}
        </div>
      )}

      {/* Sets table */}
      <div className="px-4 py-3">
        <div className="space-y-1.5">
          {sets
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((set: any) => (
              <div key={set.id} className="flex items-center gap-4 text-sm">
                <span className="w-8 text-[11px] text-muted-foreground font-mono">
                  {set.set_number}
                </span>
                <span className="text-foreground tabular-nums font-medium">
                  {set.weight_kg}kg
                </span>
                <span className="text-muted-foreground">×</span>
                <span className="text-foreground tabular-nums">{set.reps}</span>
                {set.rpe && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    RPE {set.rpe}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                  {set.weight_kg * set.reps}kg
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
