import { getUserStats, getWorkouts, getAllPersonalRecords } from "@/lib/actions/workouts";
import { StatsClient } from "./client";

export default async function StatsPage() {
  const [stats, workouts, personalRecords] = await Promise.all([
    getUserStats(),
    getWorkouts(100),
    getAllPersonalRecords(),
  ]);

  return <StatsClient stats={stats} workouts={workouts} personalRecords={personalRecords} />;
}
