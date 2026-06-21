import {
  getWorkoutById,
  getProgressComparison,
  getPersonalRecord,
} from "@/lib/actions/workouts";
import { notFound } from "next/navigation";
import { WorkoutDetail } from "./client";
import type { ProgressComparison, PersonalRecord } from "@/types";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  if (!workout) notFound();

  // Fetch progress comparison + current PR for every exercise in this
  // workout, in parallel, so each one can show its ▲/▼ badge and detect
  // whether any set just broke the existing personal record.
  const exerciseNames: string[] = (workout.exercises ?? []).map(
    (ex: any) => ex.name
  );

  const [comparisons, records] = await Promise.all([
    Promise.all(exerciseNames.map((name) => getProgressComparison(name))),
    Promise.all(exerciseNames.map((name) => getPersonalRecord(name))),
  ]);

  const progressByExercise: Record<string, ProgressComparison | null> = {};
  const prByExercise: Record<string, PersonalRecord | null> = {};
  exerciseNames.forEach((name, i) => {
    progressByExercise[name] = comparisons[i] as ProgressComparison | null;
    prByExercise[name] = records[i] as PersonalRecord | null;
  });

  return (
    <WorkoutDetail
      workout={workout}
      progressByExercise={progressByExercise}
      prByExercise={prByExercise}
    />
  );
}
