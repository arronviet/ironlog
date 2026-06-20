import { getWorkouts } from "@/lib/actions/workouts";
import { HistoryClient } from "./client";

export default async function HistoryPage() {
  const workouts = await getWorkouts(50);
  return <HistoryClient workouts={workouts} />;
}
