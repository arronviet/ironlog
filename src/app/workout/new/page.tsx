import { WorkoutForm } from "@/components/workout/workout-form";

export default function NewWorkoutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Log workout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add exercises and sets. Press Tab to move between fields.
        </p>
      </div>
      <WorkoutForm />
    </div>
  );
}
