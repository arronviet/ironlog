import { getWorkoutById, getProgressComparison } from "@/lib/actions/workouts";
import { notFound } from "next/navigation";
import { WorkoutDetail } from "./client";
import type { ProgressComparison } from "@/types";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  if (!workout) notFound();

  // Fetch progress comparison for every exercise in this workout,
  // in parallel, so each one can show its ▲/▼ badge against the
  // previous time it was performed.
  const exerciseNames: string[] = (workout.exercises ?? []).map(
    (ex: any) => ex.name
  );

  const comparisons = await Promise.all(
    exerciseNames.map((name) => getProgressComparison(name))
  );

  const progressByExercise: Record<string, ProgressComparison | null> = {};
  exerciseNames.forEach((name, i) => {
    progressByExercise[name] = comparisons[i] as ProgressComparison | null;
  });

  return <WorkoutDetail workout={workout} progressByExercise={progressByExercise} />;
}
