'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'
import type { PRStats, PRTrackedExercise, PROfficialRecord } from '@/types/prs'

export const getTrackedExercises = cache(async (): Promise<PRTrackedExercise[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pr_tracked_exercises')
    .select('id, user_id, exercise_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) { console.error('[getTrackedExercises]', error.message); return [] }
  return data ?? []
})

export const getOfficialPRs = cache(async (): Promise<PROfficialRecord[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('pr_official_records')
    .select('id, user_id, exercise_name, one_rm, achieved_date, notes, created_at, updated_at')
    .eq('user_id', user.id)

  if (error) { console.error('[getOfficialPRs]', error.message); return [] }
  return data ?? []
})

export const getExerciseHistory = cache(async (exerciseName: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('exercise_history')
    .select('performed_at, best_set_weight, best_set_reps, total_volume, estimated_1rm, sets_count')
    .eq('user_id', user.id)
    .eq('exercise_name', exerciseName)
    .order('performed_at', { ascending: true })
    .gte('performed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

  if (error) { console.error('[getExerciseHistory]', exerciseName, error.message); return [] }
  return data ?? []
})

export function computePRStats(
  exerciseName: string,
  history: Awaited<ReturnType<typeof getExerciseHistory>>,
  official: PROfficialRecord | undefined,
): PRStats {
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
      officialPR: official ?? null,
      display1RM: official?.one_rm ?? null,
      isOfficial: !!official,
      history: [],
    }
  }

  const e1rms = history.map(h =>
    h.estimated_1rm ?? (h.best_set_weight * (1 + (h.best_set_reps ?? 0) / 30)),
  )

  const sorted = [...e1rms].sort((a, b) => b - a)
  const max1RM = sorted[0]
  const prev1RM = sorted[1] ?? null

  const growthPercent =
    prev1RM != null && prev1RM > 0
      ? Math.round(((max1RM - prev1RM) / prev1RM) * 100 * 10) / 10
      : null

  const maxIdx = e1rms.indexOf(max1RM)
  const prDate = history[maxIdx]?.performed_at?.split('T')[0] ?? null

  const maxWeight = Math.max(...history.map(h => h.best_set_weight ?? 0))
  const maxReps = Math.max(...history.map(h => h.best_set_reps ?? 0))
  const maxVolume = Math.max(...history.map(h => h.total_volume ?? 0))

  const display1RM = official?.one_rm ?? Math.round(max1RM * 10) / 10

  return {
    exerciseName,
    current1RM: Math.round(max1RM * 10) / 10,
    previous1RM: prev1RM != null ? Math.round(prev1RM * 10) / 10 : null,
    growthPercent,
    prDate,
    maxWeight,
    maxReps,
    maxVolume,
    officialPR: official ?? null,
    display1RM,
    isOfficial: !!official,
    history: history.map((h, i) => ({
      date: h.performed_at.split('T')[0],
      estimated1RM: Math.round(e1rms[i] * 10) / 10,
      bestSetWeight: h.best_set_weight,
      bestSetReps: h.best_set_reps,
      totalVolume: h.total_volume,
    })),
  }
}

export async function getAllPRStats(): Promise<PRStats[]> {
  const [tracked, officials] = await Promise.all([
    getTrackedExercises(),
    getOfficialPRs(),
  ])

  if (tracked.length === 0) return []

  const histories = await Promise.all(
    tracked.map(ex => getExerciseHistory(ex.exercise_name)),
  )

  const officialsMap = new Map(officials.map(o => [o.exercise_name, o]))

  return tracked.map((ex, i) =>
    computePRStats(ex.exercise_name, histories[i], officialsMap.get(ex.exercise_name)),
  )
}

export const getAvailableExercises = cache(async (query = ''): Promise<string[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const q = supabase.from('exercises').select('name').order('name').limit(20)
  if (query.trim()) q.ilike('name', `%${query.trim()}%`)

  const { data, error } = await q
  if (error) return []
  return (data ?? []).map(d => d.name)
})

export async function addTrackedExercise(exerciseName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('pr_tracked_exercises')
    .insert({ user_id: user.id, exercise_name: exerciseName.trim() })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/prs')
  return { success: true }
}

export async function removeTrackedExercise(exerciseName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('pr_tracked_exercises')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_name', exerciseName)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/prs')
  return { success: true }
}

export async function setOfficialPR(
  exerciseName: string,
  oneRM: number,
  achievedDate: string,
  notes?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('pr_official_records')
    .upsert(
      {
        user_id: user.id,
        exercise_name: exerciseName,
        one_rm: oneRM,
        achieved_date: achievedDate,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_name' },
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard/prs')
  return { success: true }
}

export async function deleteOfficialPR(exerciseName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('pr_official_records')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_name', exerciseName)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/prs')
  return { success: true }
}