"use client";

import { useState } from "react";
import { createWorkout } from "@/lib/actions/workouts";
import { parseQuickSetInput } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { WorkoutFormData, ExerciseInput, SetInput, WorkoutType, EnergyLevel } from "@/types";

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Leg Day" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "custom", label: "Custom" },
];

const WORKOUT_TEMPLATES: Record<WorkoutType, string[]> = {
  push: ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Lateral Raises", "Tricep Pushdown"],
  pull: ["Pull-ups", "Barbell Row", "Cable Row", "Face Pulls", "Bicep Curl"],
  legs: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raises"],
  upper: ["Bench Press", "Pull-ups", "Overhead Press", "Barbell Row", "Lateral Raises"],
  lower: ["Squat", "Deadlift", "Leg Press", "Leg Curl", "Hip Thrust"],
  full_body: ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Pull-ups"],
  custom: [],
};

const emptySet = (): SetInput => ({ weight: "", reps: "", rpe: "" });
const emptyExercise = (): ExerciseInput => ({ name: "", sets: [emptySet()] });

export function WorkoutForm() {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("push");
  const [workoutName, setWorkoutName] = useState("Push Day");
  const [exercises, setExercises] = useState<ExerciseInput[]>([emptyExercise()]);
  const [notes, setNotes] = useState("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
  const [loading, setLoading] = useState(false);
  const [startedAt] = useState(new Date().toISOString());
  const [quickInput, setQuickInput] = useState<Record<string, string>>({});

  const handleTypeChange = (type: WorkoutType) => {
    setWorkoutType(type);
    const defaultName =
      type === "push" ? "Push Day" :
      type === "pull" ? "Pull Day" :
      type === "legs" ? "Leg Day" :
      type === "upper" ? "Upper Body" :
      type === "lower" ? "Lower Body" :
      type === "full_body" ? "Full Body" : "Workout";
    setWorkoutName(defaultName);

    const template = WORKOUT_TEMPLATES[type];
    if (template.length > 0) {
      setExercises(template.map((name) => ({ name, sets: [emptySet()] })));
    } else {
      setExercises([emptyExercise()]);
    }
  };

  const updateExerciseName = (idx: number, name: string) => {
    setExercises((prev) => prev.map((ex, i) => i === idx ? { ...ex, name } : ex));
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetInput, value: string) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
          : ex
      )
    );
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        // Copy last set's weight
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { weight: lastSet?.weight ?? "", reps: lastSet?.reps ?? "", rpe: "" }],
        };
      })
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex
      )
    );
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, emptyExercise()]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuickInput = (exIdx: number, value: string) => {
    setQuickInput((prev) => ({ ...prev, [exIdx]: value }));
  };

  const processQuickInput = (exIdx: number) => {
    const input = quickInput[exIdx]?.trim();
    if (!input) return;

    const parsed = parseQuickSetInput(input);
    if (parsed) {
      const lastSet = exercises[exIdx].sets[exercises[exIdx].sets.length - 1];
      const isEmpty = !lastSet?.weight && !lastSet?.reps;

      if (isEmpty) {
        updateSet(exIdx, exercises[exIdx].sets.length - 1, "weight", String(parsed.weight));
        updateSet(exIdx, exercises[exIdx].sets.length - 1, "reps", String(parsed.reps));
      } else {
        setExercises((prev) =>
          prev.map((ex, i) =>
            i === exIdx
              ? {
                  ...ex,
                  sets: [...ex.sets, { weight: String(parsed.weight), reps: String(parsed.reps), rpe: "" }],
                }
              : ex
          )
        );
      }
      setQuickInput((prev) => ({ ...prev, [exIdx]: "" }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data: WorkoutFormData = {
      name: workoutName,
      workout_type: workoutType,
      exercises,
      notes,
      energy_level: energyLevel,
      started_at: startedAt,
    };
   try {
  await createWorkout(data);
} catch (err) {
  if (
    err instanceof Error &&
    err.message !== "NEXT_REDIRECT"
  ) {
    console.error(err);
  }

  setLoading(false);
}
  };

  return (
    <div className="space-y-6">
      {/* Workout metadata */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        {/* Type selector */}
        <div className="flex flex-wrap gap-1.5">
          {WORKOUT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                workoutType === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Workout name"
          className="w-full bg-transparent text-lg font-semibold text-foreground placeholder-muted-foreground focus:outline-none border-b border-transparent focus:border-border pb-1 transition-colors"
        />
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map((exercise, exIdx) => (
          <ExerciseCard
            key={exIdx}
            exercise={exercise}
            exIdx={exIdx}
            quickInputValue={quickInput[exIdx] ?? ""}
            onNameChange={(name) => updateExerciseName(exIdx, name)}
            onSetChange={updateSet}
            onAddSet={() => addSet(exIdx)}
            onRemoveSet={(setIdx) => removeSet(exIdx, setIdx)}
            onRemoveExercise={() => removeExercise(exIdx)}
            onQuickInput={(val) => handleQuickInput(exIdx, val)}
            onQuickInputSubmit={() => processQuickInput(exIdx)}
          />
        ))}

        <button
          type="button"
          onClick={addExercise}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add exercise
        </button>
      </div>

      {/* Notes & energy */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">
            Session notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the session feel? Any PRs, form notes, or observations..."
            rows={3}
            className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            Energy level
          </label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as EnergyLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEnergyLevel(level)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  energyLevel === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {energyLevel === 1 ? "Exhausted" : energyLevel === 2 ? "Low" : energyLevel === 3 ? "Normal" : energyLevel === 4 ? "Good" : "Peak"}
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Save workout"}
      </button>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: ExerciseInput;
  exIdx: number;
  quickInputValue: string;
  onNameChange: (name: string) => void;
  onSetChange: (exIdx: number, setIdx: number, field: keyof SetInput, value: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
  onRemoveExercise: () => void;
  onQuickInput: (val: string) => void;
  onQuickInputSubmit: () => void;
}

function ExerciseCard({
  exercise,
  exIdx,
  quickInputValue,
  onNameChange,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onQuickInput,
  onQuickInputSubmit,
}: ExerciseCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Exercise header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <input
          value={exercise.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Exercise name"
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={onRemoveExercise}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sets */}
      <div className="px-4 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
          <span className="w-8">Set</span>
          <span className="w-20">Weight</span>
          <span className="w-14">Reps</span>
          <span className="w-14">RPE</span>
        </div>

        {exercise.sets.map((set, setIdx) => (
          <div key={setIdx} className="flex items-center gap-2 group">
            <span className="w-8 text-xs text-muted-foreground font-mono">{setIdx + 1}</span>
            <input
              value={set.weight}
              onChange={(e) => onSetChange(exIdx, setIdx, "weight", e.target.value)}
              placeholder="—"
              className="w-20 bg-input border border-border rounded px-2.5 py-1 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors text-center tabular-nums"
            />
            <input
              value={set.reps}
              onChange={(e) => onSetChange(exIdx, setIdx, "reps", e.target.value)}
              placeholder="—"
              className="w-14 bg-input border border-border rounded px-2.5 py-1 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors text-center tabular-nums"
            />
            <input
              value={set.rpe}
              onChange={(e) => onSetChange(exIdx, setIdx, "rpe", e.target.value)}
              placeholder="—"
              className="w-14 bg-input border border-border rounded px-2.5 py-1 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors text-center tabular-nums"
            />
            <button
              type="button"
              onClick={() => onRemoveSet(setIdx)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Quick add row */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <input
            value={quickInputValue}
            onChange={(e) => onQuickInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onQuickInputSubmit();
              }
            }}
            placeholder="80 x 8 (quick add)"
            className="flex-1 bg-transparent text-xs text-muted-foreground placeholder-muted-foreground/50 focus:outline-none focus:text-foreground transition-colors"
          />
          <button
            type="button"
            onClick={onAddSet}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
