import {
  getWorkoutById,
  getProgressComparisonBatch,
  getPersonalRecordsBatch,
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
  // workout in two batched queries (instead of 2×N), so each exercise
  // can show its ▲/▼ badge and detect whether any set just broke the
  // existing personal record — without N round trips to the database.
  const exerciseNames: string[] = (workout.exercises ?? []).map(
    (ex: any) => ex.name
  );

  const [progressByExercise, prByExercise] = await Promise.all([
    getProgressComparisonBatch(exerciseNames),
    getPersonalRecordsBatch(exerciseNames),
  ]);

  return (
    <WorkoutDetail
      workout={workout}
      progressByExercise={progressByExercise}
      prByExercise={prByExercise}
    />
  );
}
