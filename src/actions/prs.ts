'use server'

// ============================================================
// PR Feature - Server Actions
// File: src/actions/prs.ts
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  PRTrackedExercise,
  PROfficialRecord,
  ExerciseHistoryRow,
  PRStats,
  PRDataPoint,
  AddTrackedExerciseInput,
  SetOfficialPRInput,
  DeleteOfficialPRInput,
  ActionResult,
} from '@/types/prs'

// ── Helper: Epley 1RM formula ─────────────────────────────────
function calcEpley(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// ── Helper: format date từ timestamptz → "YYYY-MM-DD" ─────────
function toDateStr(ts: string): string {
  return new Date(ts).toISOString().split('T')[0]
}

// ── Helper: get current user (throws nếu chưa login) ──────────
async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

// ============================================================
// READ ACTIONS
// ============================================================

/** Lấy danh sách exercises đang được track */
export async function getTrackedExercises(): Promise<PRTrackedExercise[]> {
  const { supabase, user } = await getUser()

  const { data, error } = await supabase
    .from('pr_tracked_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Lấy tất cả Official PRs của user */
export async function getOfficialPRs(): Promise<PROfficialRecord[]> {
  const { supabase, user } = await getUser()

  const { data, error } = await supabase
    .from('pr_official_records')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Lấy lịch sử exercise_history cho một exercise cụ thể */
export async function getExerciseHistory(
  exerciseName: string
): Promise<ExerciseHistoryRow[]> {
  const { supabase, user } = await getUser()

  // exercise_history join workouts để verify user_id
  // workouts có user_id field (cần kiểm tra RLS hoặc join trực tiếp)
  const { data, error } = await supabase
    .from('exercise_history')
    .select(`
      exercise_name,
      workout_id,
      performed_at,
      best_set_weight,
      best_set_reps,
      total_volume,
      estimated_1rm,
      sets_count,
      created_at,
      workouts!inner(id)
    `)
    .eq('exercise_name', exerciseName)
    .order('performed_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ExerciseHistoryRow[]
}

/**
 * Tính PRStats cho một exercise từ lịch sử.
 * Đây là hàm core — tính estimated 1RM, growth%, bests, chart data.
 */
export async function computePRStats(
  exerciseName: string,
  officialPR: PROfficialRecord | null
): Promise<PRStats> {
  const history = await getExerciseHistory(exerciseName)

  if (history.length === 0) {
    return {
      exerciseName,
      current1RM: null,
      previous1RM: null,
      growthPercent: null,
      prDate: null,
      maxWeight: null,
      maxReps: null,
      maxVolume: null,
      officialPR,
      display1RM: officialPR?.one_rm ?? null,
      isOfficial: !!officialPR,
      history: [],
    }
  }

  // Build chart data points
  const chartPoints: PRDataPoint[] = history.map((row) => ({
    date: toDateStr(row.performed_at),
    estimated1RM: Number(row.estimated_1rm),
    bestSetWeight: Number(row.best_set_weight),
    bestSetReps: Number(row.best_set_reps),
    totalVolume: Number(row.total_volume),
  }))

  // Tìm current PR (max estimated_1rm)
  let maxIdx = 0
  let secondMax: number | null = null

  for (let i = 0; i < chartPoints.length; i++) {
    if (chartPoints[i].estimated1RM > chartPoints[maxIdx].estimated1RM) {
      secondMax = chartPoints[maxIdx].estimated1RM
      maxIdx = i
    } else if (
      secondMax === null ||
      chartPoints[i].estimated1RM > secondMax
    ) {
      if (i !== maxIdx) secondMax = chartPoints[i].estimated1RM
    }
  }

  const current1RM = chartPoints[maxIdx].estimated1RM
  const prDate = chartPoints[maxIdx].date
  const previous1RM = secondMax

  const growthPercent =
    previous1RM && previous1RM > 0
      ? ((current1RM - previous1RM) / previous1RM) * 100
      : null

  // Raw bests
  const maxWeight = Math.max(...history.map((r) => Number(r.best_set_weight)))
  const maxReps = Math.max(...history.map((r) => Number(r.best_set_reps)))
  const maxVolume = Math.max(...history.map((r) => Number(r.total_volume)))

  // Display 1RM: ưu tiên official nếu có
  const display1RM = officialPR ? officialPR.one_rm : current1RM
  const isOfficial = !!officialPR

  return {
    exerciseName,
    current1RM,
    previous1RM,
    growthPercent,
    prDate,
    maxWeight,
    maxReps,
    maxVolume,
    officialPR,
    display1RM,
    isOfficial,
    history: chartPoints,
  }
}

/**
 * Load toàn bộ PRStats cho tất cả tracked exercises.
 * Dùng ở trang /prs (Server Component).
 */
export async function getAllPRStats(): Promise<PRStats[]> {
  const [trackedList, officialList] = await Promise.all([
    getTrackedExercises(),
    getOfficialPRs(),
  ])

  const officialMap = new Map<string, PROfficialRecord>()
  for (const rec of officialList) {
    officialMap.set(rec.exercise_name, rec)
  }

  const statsArr = await Promise.all(
    trackedList.map((tracked) =>
      computePRStats(
        tracked.exercise_name,
        officialMap.get(tracked.exercise_name) ?? null
      )
    )
  )

  return statsArr
}

// ============================================================
// MUTATION ACTIONS
// ============================================================

/** Thêm exercise vào danh sách theo dõi PR */
export async function addTrackedExercise(
  input: AddTrackedExerciseInput
): Promise<ActionResult<PRTrackedExercise>> {
  try {
    const { supabase, user } = await getUser()

    const { data, error } = await supabase
      .from('pr_tracked_exercises')
      .insert({
        user_id: user.id,
        exercise_name: input.exerciseName.trim(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Exercise này đã được theo dõi.' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/prs')
    return { success: true, data: data as PRTrackedExercise }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Xoá exercise khỏi danh sách theo dõi PR */
export async function removeTrackedExercise(
  exerciseName: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()

    const { error } = await supabase
      .from('pr_tracked_exercises')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)

    if (error) return { success: false, error: error.message }

    revalidatePath('/prs')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Đặt Official PR thủ công (upsert) */
export async function setOfficialPR(
  input: SetOfficialPRInput
): Promise<ActionResult<PROfficialRecord>> {
  try {
    const { supabase, user } = await getUser()

    const { data, error } = await supabase
      .from('pr_official_records')
      .upsert(
        {
          user_id: user.id,
          exercise_name: input.exerciseName,
          one_rm: input.oneRM,
          achieved_date: input.achievedDate,
          notes: input.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_name' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/prs')
    return { success: true, data: data as PROfficialRecord }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Xoá Official PR (quay về estimated) */
export async function deleteOfficialPR(
  input: DeleteOfficialPRInput
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getUser()

    const { error } = await supabase
      .from('pr_official_records')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/prs')
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/** Lấy danh sách tất cả exercise names từ exercise_history (để autocomplete) */
export async function getAvailableExercises(): Promise<string[]> {
  const { supabase } = await getUser()

  const { data, error } = await supabase
    .from('exercise_history')
    .select('exercise_name')
    .order('exercise_name', { ascending: true })

  if (error) return []

  // Deduplicate
  const unique = [...new Set((data ?? []).map((r) => r.exercise_name))]
  return unique
}