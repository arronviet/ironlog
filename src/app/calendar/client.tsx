"use client";

import { useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { getWorkoutTypeBadgeClass, getWorkoutTypeLabel } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  workouts: any[];
}

export function CalendarClient({ workouts }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start
  const startPadding = getDay(monthStart); // 0 = Sunday
  const paddedDays = [
    ...Array(startPadding).fill(null),
    ...days,
  ];

  const getWorkoutsForDay = (date: Date) =>
    workouts.filter((w) => isSameDay(new Date(w.started_at), date));

  const selectedWorkouts = selectedDate ? getWorkoutsForDay(selectedDate) : [];

  const workoutsThisMonth = workouts.filter((w) =>
    isSameMonth(new Date(w.started_at), currentMonth)
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workoutsThisMonth} sessions this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground w-32 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {paddedDays.map((day, idx) => {
            if (!day) {
              return (
                <div key={`pad-${idx}`} className="aspect-square border-r border-b border-border/50" />
              );
            }

            const dayWorkouts = getWorkoutsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasWorkout = dayWorkouts.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() =>
                  setSelectedDate(
                    isSelected ? null : day
                  )
                }
                className={`aspect-square border-r border-b border-border/50 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-accent/50 ${
                  isSelected ? "bg-accent" : ""
                }`}
              >
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    isToday
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isSelected
                      ? "text-foreground font-medium"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {hasWorkout && (
                  <div className="flex gap-0.5">
                    {dayWorkouts.slice(0, 3).map((w, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          Workout
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground">8</div>
          Today
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="animate-in">
          <h2 className="text-sm font-medium text-foreground mb-3">
            {format(selectedDate, "EEEE, MMMM d")}
          </h2>
          {selectedWorkouts.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-lg px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">Rest day</p>
              <Link
                href="/workout/new"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                Log a workout →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/workout/${workout.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded ${getWorkoutTypeBadgeClass(workout.workout_type)}`}
                  >
                    {getWorkoutTypeLabel(workout.workout_type)}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {workout.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {workout.exercises?.length ?? 0} exercises →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
