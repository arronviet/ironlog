"use client";

import { useState, useTransition } from "react";
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
import {
  updateExerciseSet,
  deleteExerciseSet,
  addExerciseSet,
} from "@/lib/actions/workouts";
import { useWorkoutStore } from "@/lib/store/workout";
import { ArrowLeft, Zap, Pencil, Trash2, Check, X, Plus } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ weight: string; reps: string; rpe: string }>({
    weight: "",
    reps: "",
    rpe: "",
  });
  const [addingSet, setAddingSet] = useState(false);
  const [newSet, setNewSet] = useState({ weight: "", reps: "", rpe: "" });
  const [error, setError] = useState<string | null>(null);
  const addToast = useWorkoutStore((s) => s.addToast);

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

  const startEdit = (set: any) => {
    setError(null);
    setEditingSetId(set.id);
    setDraft({
      weight: String(set.weight_kg),
      reps: String(set.reps),
      rpe: set.rpe ? String(set.rpe) : "",
    });
  };

  const cancelEdit = () => {
    setEditingSetId(null);
    setError(null);
  };

  const saveEdit = (setId: string) => {
    const weight = parseFloat(draft.weight);
    const reps = parseInt(draft.reps);
    const rpe = draft.rpe ? parseFloat(draft.rpe) : null;

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps <= 0) {
      setError("Enter a valid weight and reps");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await updateExerciseSet(setId, exercise.id, { weight_kg: weight, reps, rpe });
        setEditingSetId(null);
        addToast({ title: "Set updated", variant: "success" });
      } catch (err) {
        setError("Failed to save. Try again.");
      }
    });
  };

  const removeSet = (setId: string) => {
    startTransition(async () => {
      try {
        await deleteExerciseSet(setId, exercise.id);
        addToast({ title: "Set deleted", variant: "default" });
      } catch (err) {
        addToast({ title: "Failed to delete set", variant: "destructive" });
      }
    });
  };

  const submitNewSet = () => {
    const weight = parseFloat(newSet.weight);
    const reps = parseInt(newSet.reps);
    const rpe = newSet.rpe ? parseFloat(newSet.rpe) : null;

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps <= 0) {
      setError("Enter a valid weight and reps");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await addExerciseSet(exercise.id, { weight_kg: weight, reps, rpe });
        setNewSet({ weight: "", reps: "", rpe: "" });
        setAddingSet(false);
        addToast({ title: "Set added", variant: "success" });
      } catch (err) {
        setError("Failed to add set");
      }
    });
  };

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
        <div className="space-y-1">
          {sets
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((set: any) => {
              const isEditing = editingSetId === set.id;

              if (isEditing) {
                return (
                  <div key={set.id} className="py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-[11px] text-muted-foreground font-mono">
                        {set.set_number}
                      </span>
                      <input
                        autoFocus
                        value={draft.weight}
                        onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(set.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder="kg"
                        className="input-weight"
                      />
                      <span className="text-muted-foreground text-sm">×</span>
                      <input
                        value={draft.reps}
                        onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(set.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder="reps"
                        className="input-reps"
                      />
                      <input
                        value={draft.rpe}
                        onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(set.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder="RPE"
                        className="input-reps"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(set.id)}
                        disabled={isPending}
                        className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1.5 rounded text-muted-foreground hover:bg-accent transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {error && (
                      <p className="text-[11px] text-destructive ml-10 mt-1">{error}</p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={set.id}
                  className="flex items-center gap-4 text-sm group py-0.5 -mx-2 px-2 rounded hover:bg-accent/30 transition-colors"
                >
                  <span className="w-8 text-[11px] text-muted-foreground font-mono">
                    {set.set_number}
                  </span>
                  <span className="text-foreground tabular-nums font-medium">
                    {set.weight_kg}kg
                  </span>
                  <span className="text-muted-foreground">×</span>
                  <span className="text-foreground tabular-nums">{set.reps}</span>
                  {set.rpe && (
                    <span className="text-xs text-muted-foreground">RPE {set.rpe}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
                    {set.weight_kg * set.reps}kg
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(set)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSet(set.id)}
                      disabled={isPending}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

          {sets.length === 0 && !addingSet && (
            <p className="text-xs text-muted-foreground py-2">No sets logged</p>
          )}
        </div>

        {/* Add set row */}
        {addingSet ? (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="w-8 text-[11px] text-muted-foreground font-mono">
                {sets.length + 1}
              </span>
              <input
                autoFocus
                value={newSet.weight}
                onChange={(e) => setNewSet((s) => ({ ...s, weight: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewSet();
                  if (e.key === "Escape") {
                    setAddingSet(false);
                    setError(null);
                  }
                }}
                placeholder="kg"
                className="input-weight"
              />
              <span className="text-muted-foreground text-sm">×</span>
              <input
                value={newSet.reps}
                onChange={(e) => setNewSet((s) => ({ ...s, reps: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewSet();
                  if (e.key === "Escape") {
                    setAddingSet(false);
                    setError(null);
                  }
                }}
                placeholder="reps"
                className="input-reps"
              />
              <input
                value={newSet.rpe}
                onChange={(e) => setNewSet((s) => ({ ...s, rpe: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewSet();
                  if (e.key === "Escape") {
                    setAddingSet(false);
                    setError(null);
                  }
                }}
                placeholder="RPE"
                className="input-reps"
              />
              <button
                type="button"
                onClick={submitNewSet}
                disabled={isPending}
                className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingSet(false);
                  setError(null);
                }}
                className="p-1.5 rounded text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {error && <p className="text-[11px] text-destructive ml-10 mt-1">{error}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSet(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 pt-2 border-t border-border/50 w-full"
          >
            <Plus className="w-3 h-3" />
            Add set
          </button>
        )}
      </div>
    </div>
  );
}
 