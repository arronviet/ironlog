import { getWorkouts, getUserStats } from "@/lib/actions/workouts";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const [workouts, stats] = await Promise.all([
    getWorkouts(5),
    getUserStats(),
  ]);

  return <DashboardClient workouts={workouts} stats={stats} />;
}
