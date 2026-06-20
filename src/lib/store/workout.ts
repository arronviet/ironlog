"use client";

import { create } from "zustand";
import type { WorkoutFormData, ExerciseInput } from "@/types";

interface WorkoutStore {
  // Active workout being created
  activeWorkout: WorkoutFormData | null;
  setActiveWorkout: (workout: WorkoutFormData | null) => void;
  updateExercises: (exercises: ExerciseInput[]) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeWorkout: null,
  setActiveWorkout: (workout) => set({ activeWorkout: workout }),
  updateExercises: (exercises) =>
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? { ...state.activeWorkout, exercises }
        : null,
    })),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
