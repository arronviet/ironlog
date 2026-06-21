import { getWorkoutsLight } from "@/lib/actions/workouts";
import { CalendarClient } from "./client";

export default async function CalendarPage() {
  const workouts = await getWorkoutsLight(100);
  return <CalendarClient workouts={workouts} />;
} 
