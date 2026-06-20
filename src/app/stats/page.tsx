import { getUserStats, getWorkouts } from "@/lib/actions/workouts";
import { StatsClient } from "./client";

export default async function StatsPage() {
  const [stats, workouts] = await Promise.all([
    getUserStats(),
    getWorkouts(100),
  ]);

  return <StatsClient stats={stats} workouts={workouts} />;
}
