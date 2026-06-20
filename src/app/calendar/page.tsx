import { getWorkouts } from "@/lib/actions/workouts";
import { CalendarClient } from "./client";

export default async function CalendarPage() {
  const workouts = await getWorkouts(100);
  return <CalendarClient workouts={workouts} />;
}
