export type WorkoutType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "custom";

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  workout_type: WorkoutType;
  started_at: string;
  finished_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  energy_level: EnergyLevel | null;
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  order_index: number;
  sets: ExerciseSet[];
  created_at: string;
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export interface ExerciseHistory {
  id: string;
  user_id: string;
  exercise_name: string;
  workout_id: string;
  performed_at: string;
  best_set_weight: number;
  best_set_reps: number;
  total_volume: number;
  estimated_1rm: number;
  sets_count: number;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  set_id: string | null;
  workout_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  achieved_at: string;
  created_at: string;
}

export interface ProgressComparison {
  exercise_name: string;
  current: {
    weight: number;
    reps: number;
    volume: number;
    estimated_1rm: number;
  };
  previous: {
    weight: number;
    reps: number;
    volume: number;
    estimated_1rm: number;
  } | null;
  weight_change: number;
  reps_change: number;
  volume_change: number;
  trend: "up" | "down" | "same" | "new";
}

export interface UserStats {
  total_workouts: number;
  current_streak: number;
  longest_streak: number;
  total_volume_kg: number;
  total_sets: number;
  favorite_exercise: string | null;
  most_improved_lift: string | null;
  workouts_this_week: number;
  workouts_this_month: number;
}

export interface WorkoutTemplate {
  name: string;
  type: WorkoutType;
  exercises: string[];
}

// Form types
export interface SetInput {
  weight: string;
  reps: string;
  rpe: string;
}

export interface ExerciseInput {
  name: string;
  sets: SetInput[];
}

export interface WorkoutFormData {
  name: string;
  workout_type: WorkoutType;
  exercises: ExerciseInput[];
  notes: string;
  energy_level: EnergyLevel;
  started_at: string;
}