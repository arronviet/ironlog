"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { formatVolume, getStreakEmoji } from "@/lib/utils";
import type { UserStats } from "@/types";
import { Flame, Dumbbell, TrendingUp, Trophy, Calendar, Weight } from "lucide-react";

interface Props {
  stats: UserStats | null;
  workouts: any[];
}

export function StatsClient({ stats, workouts }: Props) {
  // Build last 12 weeks volume data
  const volumeData = buildWeeklyVolumeData(workouts);

  // Workout frequency last 30 days
  const frequencyData = buildFrequencyData(workouts);

  // Per-exercise progress
  const exerciseProgress = buildExerciseProgress(workouts);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Stats</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your training overview
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <MetricCard
          label="Total workouts"
          value={stats?.total_workouts ?? 0}
          icon={<Dumbbell className="w-4 h-4" />}
        />
        <MetricCard
          label="Current streak"
          value={`${stats?.current_streak ?? 0}d ${getStreakEmoji(stats?.current_streak ?? 0)}`}
          icon={<Flame className="w-4 h-4 text-orange-400" />}
          highlight={!!stats?.current_streak}
        />
        <MetricCard
          label="This week"
          value={stats?.workouts_this_week ?? 0}
          icon={<Calendar className="w-4 h-4" />}
        />
        <MetricCard
          label="Total volume"
          value={formatVolume(stats?.total_volume_kg ?? 0)}
          icon={<Weight className="w-4 h-4" />}
        />
        <MetricCard
          label="This month"
          value={stats?.workouts_this_month ?? 0}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        {stats?.favorite_exercise && (
          <MetricCard
            label="Most frequent"
            value={stats.favorite_exercise}
            icon={<Trophy className="w-4 h-4 text-yellow-400" />}
            small
          />
        )}
      </div>

      {/* Weekly volume chart */}
      {volumeData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Weekly volume
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volumeData} barSize={20}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    return (
                      <div className="bg-popover border border-border rounded px-2.5 py-1.5 text-xs">
                        <p className="text-muted-foreground">{payload[0].payload.week}</p>
                        <p className="font-medium text-foreground">
                          {formatVolume(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="volume"
                fill="hsl(var(--primary))"
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercise progress */}
      {exerciseProgress.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Exercise progress (estimated 1RM)
          </h2>
          <div className="space-y-4">
            {exerciseProgress.slice(0, 4).map(({ name, data, current1rm, change }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {current1rm}kg e1RM
                    </span>
                    {change !== 0 && (
                      <span
                        className={`text-[11px] font-medium ${
                          change > 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {change > 0 ? "▲" : "▼"} {Math.abs(change)}kg
                      </span>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={48}>
                  <LineChart data={data}>
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="bg-popover border border-border rounded px-2 py-1 text-[11px]">
                              <p className="text-foreground">{payload[0].value}kg e1RM</p>
                              <p className="text-muted-foreground">{payload[0].payload.date}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training frequency heatmap (last 30 days) */}
      {frequencyData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-foreground mb-4">
            Last 30 days
          </h2>
          <div className="flex flex-wrap gap-1">
            {frequencyData.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} workout${count !== 1 ? "s" : ""}`}
                className={`w-6 h-6 rounded-sm ${
                  count === 0
                    ? "bg-secondary"
                    : count === 1
                    ? "bg-primary/40"
                    : "bg-primary"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-secondary" />
              Rest
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              1 session
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              2+ sessions
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
  small = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div
        className={`font-semibold tabular-nums ${
          small ? "text-base" : "text-2xl"
        } ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}

function buildWeeklyVolumeData(workouts: any[]) {
  const weekMap: Record<string, number> = {};

  workouts.forEach((workout) => {
    const date = new Date(workout.started_at);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const key = format(monday, "MMM d");

    const volume =
      workout.exercises?.reduce((acc: number, ex: any) => {
        return (
          acc +
          (ex.exercise_sets?.reduce(
            (s: number, set: any) => s + set.weight_kg * set.reps,
            0
          ) ?? 0)
        );
      }, 0) ?? 0;

    weekMap[key] = (weekMap[key] ?? 0) + volume;
  });

  return Object.entries(weekMap)
    .slice(-12)
    .map(([week, volume]) => ({ week, volume }));
}

function buildFrequencyData(workouts: any[]) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 29), end: today });

  return days.map((day) => {
    const count = workouts.filter((w) =>
      isSameDay(new Date(w.started_at), day)
    ).length;
    return { date: format(day, "MMM d"), count };
  });
}

function buildExerciseProgress(workouts: any[]) {
  // Collect all exercise history points
  const exerciseMap: Record<string, { date: string; e1rm: number }[]> = {};

  workouts
    .slice()
    .reverse()
    .forEach((workout) => {
      workout.exercises?.forEach((ex: any) => {
        if (!ex.name || !ex.exercise_sets?.length) return;

        const best = ex.exercise_sets.reduce(
          (b: any, s: any) =>
            !b || s.weight_kg > b.weight_kg ? s : b,
          null
        );
        if (!best) return;

        const e1rm = Math.round(best.weight_kg * (1 + best.reps / 30));
        if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
        exerciseMap[ex.name].push({
          date: format(new Date(workout.started_at), "MMM d"),
          e1rm,
        });
      });
    });

  return Object.entries(exerciseMap)
    .filter(([, data]) => data.length >= 2)
    .map(([name, data]) => {
      const current1rm = data[data.length - 1].e1rm;
      const prev1rm = data[data.length - 2]?.e1rm ?? current1rm;
      return {
        name,
        data,
        current1rm,
        change: current1rm - prev1rm,
      };
    })
    .sort((a, b) => b.data.length - a.data.length);
}
