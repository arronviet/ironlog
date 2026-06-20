import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Epley formula for estimated 1RM
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function calculateVolume(
  sets: { weight_kg: number; reps: number }[]
): number {
  return sets.reduce((acc, set) => acc + set.weight_kg * set.reps, 0);
}

export function formatWeight(weight: number): string {
  if (weight === Math.floor(weight)) return `${weight}kg`;
  return `${weight}kg`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
  return `${volume}kg`;
}

export function getDurationString(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getWorkoutTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    push: "Push",
    pull: "Pull",
    legs: "Leg Day",
    upper: "Upper",
    lower: "Lower",
    full_body: "Full Body",
    custom: "Custom",
  };
  return labels[type] ?? type;
}

export function getWorkoutTypeBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    push: "bg-orange-500/10 text-orange-400",
    pull: "bg-blue-500/10 text-blue-400",
    legs: "bg-emerald-500/10 text-emerald-400",
    upper: "bg-purple-500/10 text-purple-400",
    lower: "bg-yellow-500/10 text-yellow-400",
    full_body: "bg-red-500/10 text-red-400",
    custom: "bg-zinc-500/10 text-zinc-400",
  };
  return classes[type] ?? "bg-zinc-500/10 text-zinc-400";
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "🔥";
  if (streak >= 14) return "⚡";
  if (streak >= 7) return "💪";
  if (streak >= 3) return "✨";
  return "";
}

export function getTrendIcon(trend: "up" | "down" | "same" | "new"): string {
  switch (trend) {
    case "up":
      return "▲";
    case "down":
      return "▼";
    case "same":
      return "→";
    case "new":
      return "★";
  }
}

export function parseQuickSetInput(input: string): {
  weight: number;
  reps: number;
} | null {
  // Parses "80 x 8" or "80x8" or "80 8"
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+)$/i,
    /^(\d+(?:\.\d+)?)\s+(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = input.trim().match(pattern);
    if (match) {
      return { weight: parseFloat(match[1]), reps: parseInt(match[2]) };
    }
  }
  return null;
}
