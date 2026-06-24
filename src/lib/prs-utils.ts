// src/lib/prs-utils.ts
// Pure functions — không có 'use server', dùng được ở cả client và server

import type { PRStats, PRDataPoint, PROfficialRecord } from '@/types/prs'

export function computePRStats(
  exerciseName: string,
  history: {
    performed_at: string
    best_set_weight: number
    best_set_reps: number
    total_volume: number
    estimated_1rm: number | null
    sets_count: number
  }[],
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

  const historyPoints: PRDataPoint[] = history.map((h, i) => ({
    date: h.performed_at.split('T')[0],
    estimated1RM: Math.round(e1rms[i] * 10) / 10,
    bestSetWeight: h.best_set_weight,
    bestSetReps: h.best_set_reps,
    totalVolume: h.total_volume,
  }))

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
    display1RM: official?.one_rm ?? Math.round(max1RM * 10) / 10,
    isOfficial: !!official,
    history: historyPoints,
  }
}