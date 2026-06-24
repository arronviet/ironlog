import { create } from 'zustand'
import type { PRStats } from '@/types/prs'

interface PRStore {
  items: PRStats[]
  isLoaded: boolean
  hydrate: (stats: PRStats[]) => void
  optimisticRemove: (exerciseName: string) => () => void
  optimisticUpdatePR: (exerciseName: string, oneRM: number) => () => void
  optimisticDeletePR: (exerciseName: string) => () => void
  sortBy: 'name' | 'current1RM' | 'growth' | 'date'
  search: string
  setSortBy: (s: PRStore['sortBy']) => void
  setSearch: (s: string) => void
}

export const usePRStore = create<PRStore>((set, get) => ({
  items: [],
  isLoaded: false,
  sortBy: 'current1RM',
  search: '',

  hydrate(stats) {
    set({ items: stats, isLoaded: true })
  },

  optimisticRemove(exerciseName) {
    const previous = get().items
    set(s => ({ items: s.items.filter(i => i.exerciseName !== exerciseName) }))
    return () => set({ items: previous })
  },

  optimisticUpdatePR(exerciseName, oneRM) {
    const previous = get().items
    set(s => ({
      items: s.items.map(i =>
        i.exerciseName === exerciseName
          ? {
              ...i,
              display1RM: oneRM,
              isOfficial: true,
              officialPR: i.officialPR
                ? { ...i.officialPR, one_rm: oneRM }
                : {
                    id: '',
                    user_id: '',
                    exercise_name: exerciseName,
                    one_rm: oneRM,
                    achieved_date: '',
                    notes: null,
                    created_at: '',
                    updated_at: '',
                  },
            }
          : i,
      ),
    }))
    return () => set({ items: previous })
  },

  optimisticDeletePR(exerciseName) {
    const previous = get().items
    set(s => ({
      items: s.items.map(i =>
        i.exerciseName === exerciseName
          ? { ...i, officialPR: null, isOfficial: false, display1RM: i.current1RM }
          : i,
      ),
    }))
    return () => set({ items: previous })
  },

  setSortBy: sortBy => set({ sortBy }),
  setSearch: search => set({ search }),
}))

export function selectFilteredPRs(
  items: PRStats[],
  search: string,
  sortBy: PRStore['sortBy'],
) {
  const q = search.toLowerCase().trim()
  const filtered = q ? items.filter(i => i.exerciseName.toLowerCase().includes(q)) : items

  return [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.exerciseName.localeCompare(b.exerciseName)
    if (sortBy === 'current1RM') return (b.display1RM ?? 0) - (a.display1RM ?? 0)
    if (sortBy === 'growth') return (b.growthPercent ?? -Infinity) - (a.growthPercent ?? -Infinity)
    if (sortBy === 'date') return (b.prDate ?? '').localeCompare(a.prDate ?? '')
    return 0
  })
}