// ============================================================
// PR Feature - TypeScript Types
// File: src/types/prs.ts
// ============================================================

// ── Database rows (khớp Supabase schema) ─────────────────────

export interface PRTrackedExercise {
  id: string
  user_id: string
  exercise_name: string
  created_at: string
}

export interface PROfficialRecord {
  id: string
  user_id: string
  exercise_name: string
  one_rm: number
  achieved_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

// exercise_history columns
export interface ExerciseHistoryRow {
  exercise_name: string
  workout_id: string
  performed_at: string        // timestamptz
  best_set_weight: number
  best_set_reps: number
  total_volume: number
  estimated_1rm: number
  sets_count: number
  created_at: string
}

// workouts columns
export interface WorkoutRow {
  id: string
  name: string
  workout_type: string
  started_at: string          // timestamptz
  finished_at: string | null
  duration_minutes: number
  notes: string | null
  energy_level: number | null
  created_at: string
}

// ── Computed / derived types ──────────────────────────────────

export interface PRDataPoint {
  date: string                // "YYYY-MM-DD" từ performed_at
  estimated1RM: number        // từ estimated_1rm
  bestSetWeight: number
  bestSetReps: number
  totalVolume: number
}

export interface PRStats {
  exerciseName: string

  // Estimated 1RM (max từ lịch sử)
  current1RM: number | null
  previous1RM: number | null
  growthPercent: number | null
  prDate: string | null

  // Raw bests
  maxWeight: number | null
  maxReps: number | null
  maxVolume: number | null

  // Official PR do user tự đặt
  officialPR: PROfficialRecord | null

  // Giá trị hiển thị cuối cùng
  display1RM: number | null
  isOfficial: boolean

  // Data cho chart
  history: PRDataPoint[]
}

// ── Form / action input types ─────────────────────────────────

export interface AddTrackedExerciseInput {
  exerciseName: string
}

export interface SetOfficialPRInput {
  exerciseName: string
  oneRM: number
  achievedDate: string        // "YYYY-MM-DD"
  notes?: string
}

export interface DeleteOfficialPRInput {
  id: string
}

// ── Server Action response wrapper ────────────────────────────

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ── UI state types ────────────────────────────────────────────

export type PRView = 'grid' | 'list'
export type PRSortBy = 'name' | 'current1RM' | 'growth' | 'date'

export interface PRFilters {
  view: PRView
  sortBy: PRSortBy
  search: string
}

// ── Predefined exercises ──────────────────────────────────────

export const POPULAR_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull Up',
  'Dumbbell Curl',
  'Tricep Pushdown',
] as const

export type PopularExercise = (typeof POPULAR_EXERCISES)[number]