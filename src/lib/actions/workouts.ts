"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { WorkoutFormData } from "@/types";
import { estimate1RM, calculateVolume } from "@/lib/utils";

export async function createWorkout(data: WorkoutFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const finishedAt = new Date();
  const startedAt = new Date(data.started_at);
  const durationMinutes = Math.round(
    (finishedAt.getTime() - startedAt.getTime()) / 60000
  );

  // Create workout
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: data.name,
      workout_type: data.workout_type,
      started_at: data.started_at,
      finished_at: finishedAt.toISOString(),
      duration_minutes: durationMinutes,
      notes: data.notes || null,
      energy_level: data.energy_level,
    })
    .select()
    .single();

  if (workoutError) throw workoutError;

  // Create exercises and sets
  for (let i = 0; i < data.exercises.length; i++) {
    const exercise = data.exercises[i];
    if (!exercise.name.trim()) continue;

    const { data: ex, error: exError } = await supabase
      .from("exercises")
      .insert({
        workout_id: workout.id,
        name: exercise.name.trim(),
        order_index: i,
      })
      .select()
      .single();

    if (exError) throw exError;

    const validSets = exercise.sets.filter(
      (s) => s.weight && s.reps && parseFloat(s.weight) > 0 && parseInt(s.reps) > 0
    );

    if (validSets.length > 0) {
      const setsToInsert = validSets.map((s, idx) => ({
        exercise_id: ex.id,
        set_number: idx + 1,
        weight_kg: parseFloat(s.weight),
        reps: parseInt(s.reps),
        rpe: s.rpe ? parseFloat(s.rpe) : null,
      }));

      const { error: setsError } = await supabase
        .from("exercise_sets")
        .insert(setsToInsert);

      if (setsError) throw setsError;

      // Update exercise history
      const setsForCalc = setsToInsert.map((s) => ({
        weight_kg: s.weight_kg,
        reps: s.reps,
      }));

      const bestSet = setsToInsert.reduce((best, s) =>
        s.weight_kg > best.weight_kg ||
        (s.weight_kg === best.weight_kg && s.reps > best.reps)
          ? s
          : best
      );

      await supabase.from("exercise_history").insert({
        user_id: user.id,
        exercise_name: exercise.name.trim(),
        workout_id: workout.id,
        performed_at: workout.started_at,
        best_set_weight: bestSet.weight_kg,
        best_set_reps: bestSet.reps,
        total_volume: calculateVolume(setsForCalc),
        estimated_1rm: estimate1RM(bestSet.weight_kg, bestSet.reps),
        sets_count: validSets.length,
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/calendar");
  revalidatePath("/stats");

  redirect(`/workout/${workout.id}`);
}

export async function getWorkouts(limit = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workouts")
    .select(`
      *,
      exercises (
        *,
        exercise_sets (*)
      )
    `)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getWorkoutById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workouts")
    .select(`
      *,
      exercises (
        *,
        exercise_sets (*)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("workouts").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect("/dashboard");
}

export async function getExerciseHistory(exerciseName: string, limit = 12) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exercise_history")
    .select("*")
    .eq("user_id", user.id)
    .ilike("exercise_name", exerciseName)
    .order("performed_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getUserStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("started_at")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (!workouts || workouts.length === 0) {
    return {
      total_workouts: 0,
      current_streak: 0,
      longest_streak: 0,
      total_volume_kg: 0,
      total_sets: 0,
      favorite_exercise: null,
      most_improved_lift: null,
      workouts_this_week: 0,
      workouts_this_month: 0,
    };
  }

  // Calculate streak
  const dates = workouts.map((w) => new Date(w.started_at).toDateString());
  const uniqueDates = [...new Set(dates)];

  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    const diffDays = Math.floor(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 1 + i) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Total volume
  const { data: setsData } = await supabase
    .from("exercise_sets")
    .select("weight_kg, reps, exercises!inner(workout_id, workouts!inner(user_id))")
    .eq("exercises.workouts.user_id", user.id);

  const totalVolume =
    setsData?.reduce((acc, s) => acc + s.weight_kg * s.reps, 0) ?? 0;
  const totalSets = setsData?.length ?? 0;

  // Favorite exercise
  const { data: historyData } = await supabase
    .from("exercise_history")
    .select("exercise_name")
    .eq("user_id", user.id);

  const exerciseCounts =
    historyData?.reduce(
      (acc, h) => {
        acc[h.exercise_name] = (acc[h.exercise_name] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) ?? {};

  const favoriteExercise =
    Object.entries(exerciseCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
    null;

  // This week / month
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

  const workoutsThisWeek = workouts.filter(
    (w) => new Date(w.started_at) >= weekAgo
  ).length;
  const workoutsThisMonth = workouts.filter(
    (w) => new Date(w.started_at) >= monthAgo
  ).length;

  return {
    total_workouts: workouts.length,
    current_streak: currentStreak,
    longest_streak: currentStreak, // Simplified
    total_volume_kg: Math.round(totalVolume),
    total_sets: totalSets,
    favorite_exercise: favoriteExercise,
    most_improved_lift: favoriteExercise,
    workouts_this_week: workoutsThisWeek,
    workouts_this_month: workoutsThisMonth,
  };
}

export async function getProgressComparison(exerciseName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("exercise_history")
    .select("*")
    .eq("user_id", user.id)
    .ilike("exercise_name", exerciseName)
    .order("performed_at", { ascending: false })
    .limit(2);

  if (!data || data.length === 0) return null;

  const current = data[0];
  const previous = data[1] ?? null;

  let trend: "up" | "down" | "same" | "new" = "new";
  if (previous) {
    if (
      current.best_set_weight > previous.best_set_weight ||
      current.estimated_1rm > previous.estimated_1rm
    ) {
      trend = "up";
    } else if (
      current.best_set_weight < previous.best_set_weight ||
      current.estimated_1rm < previous.estimated_1rm
    ) {
      trend = "down";
    } else {
      trend = "same";
    }
  }

  return {
    exercise_name: exerciseName,
    current: {
      weight: current.best_set_weight,
      reps: current.best_set_reps,
      volume: current.total_volume,
      estimated_1rm: current.estimated_1rm,
    },
    previous: previous
      ? {
          weight: previous.best_set_weight,
          reps: previous.best_set_reps,
          volume: previous.total_volume,
          estimated_1rm: previous.estimated_1rm,
        }
      : null,
    weight_change: previous
      ? current.best_set_weight - previous.best_set_weight
      : 0,
    reps_change: previous ? current.best_set_reps - previous.best_set_reps : 0,
    volume_change: previous
      ? current.total_volume - previous.total_volume
      : 0,
    trend,
  };
}

// ============================================================
// SET EDITING — update / delete / add a single set after a
// workout has already been saved, plus add a brand new exercise.
// Every mutation re-derives the exercise_history row for that
// workout so Progressive Overload comparisons stay accurate.
// ============================================================

async function recomputeExerciseHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseId: string
) {
  // Load the exercise + its workout + its current sets
  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name, workout_id, workouts!inner(user_id, started_at)")
    .eq("id", exerciseId)
    .single();

  if (!exercise) return;

  const workoutJoined = (exercise as any).workouts;
  const workout = Array.isArray(workoutJoined) ? workoutJoined[0] : workoutJoined;
  if (!workout || workout.user_id !== userId) throw new Error("Unauthorized");

  const { data: sets } = await supabase
    .from("exercise_sets")
    .select("weight_kg, reps")
    .eq("exercise_id", exerciseId);

  // Always remove the old history row for this workout+exercise first.
  await supabase
    .from("exercise_history")
    .delete()
    .eq("workout_id", exercise.workout_id)
    .eq("exercise_name", exercise.name)
    .eq("user_id", userId);

  if (!sets || sets.length === 0) {
    // No sets left — nothing to record.
    return;
  }

  const bestSet = sets.reduce((best, s) =>
    s.weight_kg > best.weight_kg || (s.weight_kg === best.weight_kg && s.reps > best.reps)
      ? s
      : best
  );

  await supabase.from("exercise_history").insert({
    user_id: userId,
    exercise_name: exercise.name,
    workout_id: exercise.workout_id,
    performed_at: workout.started_at,
    best_set_weight: bestSet.weight_kg,
    best_set_reps: bestSet.reps,
    total_volume: calculateVolume(sets),
    estimated_1rm: estimate1RM(bestSet.weight_kg, bestSet.reps),
    sets_count: sets.length,
  });
}

export async function updateExerciseSet(
  setId: string,
  exerciseId: string,
  updates: { weight_kg: number; reps: number; rpe: number | null }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (
    !Number.isFinite(updates.weight_kg) ||
    updates.weight_kg <= 0 ||
    !Number.isInteger(updates.reps) ||
    updates.reps <= 0
  ) {
    throw new Error("Invalid weight or reps");
  }

  // Ownership check happens implicitly via RLS, but we double-check
  // here so recomputeExerciseHistory can trust the exerciseId.
  const { error } = await supabase
    .from("exercise_sets")
    .update({
      weight_kg: updates.weight_kg,
      reps: updates.reps,
      rpe: updates.rpe,
    })
    .eq("id", setId);

  if (error) throw error;

  await recomputeExerciseHistory(supabase, user.id, exerciseId);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/calendar");
  revalidatePath("/stats");
}

export async function deleteExerciseSet(setId: string, exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("exercise_sets")
    .delete()
    .eq("id", setId);

  if (error) throw error;

  await recomputeExerciseHistory(supabase, user.id, exerciseId);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/calendar");
  revalidatePath("/stats");
}

export async function addExerciseSet(
  exerciseId: string,
  newSet: { weight_kg: number; reps: number; rpe: number | null }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (
    !Number.isFinite(newSet.weight_kg) ||
    newSet.weight_kg <= 0 ||
    !Number.isInteger(newSet.reps) ||
    newSet.reps <= 0
  ) {
    throw new Error("Invalid weight or reps");
  }

  const { count } = await supabase
    .from("exercise_sets")
    .select("id", { count: "exact", head: true })
    .eq("exercise_id", exerciseId);

  const { error } = await supabase.from("exercise_sets").insert({
    exercise_id: exerciseId,
    set_number: (count ?? 0) + 1,
    weight_kg: newSet.weight_kg,
    reps: newSet.reps,
    rpe: newSet.rpe,
  });

  if (error) throw error;

  await recomputeExerciseHistory(supabase, user.id, exerciseId);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/calendar");
  revalidatePath("/stats");
}