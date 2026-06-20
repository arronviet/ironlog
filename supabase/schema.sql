-- ============================================================
-- IronLog Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- WORKOUTS
-- ============================================================
create table if not exists workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  workout_type text not null check (workout_type in ('push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'custom')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_minutes integer,
  notes text,
  energy_level integer check (energy_level between 1 and 5),
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXERCISES
-- ============================================================
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references workouts(id) on delete cascade not null,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXERCISE SETS
-- ============================================================
create table if not exists exercise_sets (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null,
  weight_kg numeric(6,2) not null,
  reps integer not null,
  rpe numeric(3,1) check (rpe between 1 and 10),
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXERCISE HISTORY (denormalized for fast progress queries)
-- ============================================================
create table if not exists exercise_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_name text not null,
  workout_id uuid references workouts(id) on delete cascade not null,
  performed_at timestamptz not null,
  best_set_weight numeric(6,2) not null,
  best_set_reps integer not null,
  total_volume numeric(10,2) not null,
  estimated_1rm numeric(6,2) not null,
  sets_count integer not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Workouts
alter table workouts enable row level security;

create policy "Users can manage own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Exercises (via workout ownership)
alter table exercises enable row level security;

create policy "Users can manage exercises in own workouts"
  on exercises for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = exercises.workout_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts
      where workouts.id = exercises.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- Exercise sets (via exercise -> workout ownership)
alter table exercise_sets enable row level security;

create policy "Users can manage sets in own exercises"
  on exercise_sets for all
  using (
    exists (
      select 1 from exercises
      join workouts on workouts.id = exercises.workout_id
      where exercises.id = exercise_sets.exercise_id
        and workouts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from exercises
      join workouts on workouts.id = exercises.workout_id
      where exercises.id = exercise_sets.exercise_id
        and workouts.user_id = auth.uid()
    )
  );

-- Exercise history
alter table exercise_history enable row level security;

create policy "Users can manage own exercise history"
  on exercise_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_workouts_user_id on workouts(user_id);
create index if not exists idx_workouts_started_at on workouts(started_at desc);
create index if not exists idx_exercises_workout_id on exercises(workout_id);
create index if not exists idx_exercise_sets_exercise_id on exercise_sets(exercise_id);
create index if not exists idx_exercise_history_user_id on exercise_history(user_id);
create index if not exists idx_exercise_history_name on exercise_history(user_id, exercise_name);
create index if not exists idx_exercise_history_performed_at on exercise_history(performed_at desc);

-- ============================================================
-- SAMPLE DATA (optional - run after creating your account)
-- ============================================================
-- Replace 'your-user-id-here' with your actual Supabase user ID

/*
do $$
declare
  v_user_id uuid := 'your-user-id-here';
  v_workout_id uuid;
  v_exercise_id uuid;
begin
  -- Sample Push Day
  insert into workouts (user_id, name, workout_type, started_at, finished_at, duration_minutes, energy_level)
  values (v_user_id, 'Push Day', 'push', now() - interval '2 days', now() - interval '2 days' + interval '75 minutes', 75, 4)
  returning id into v_workout_id;

  insert into exercises (workout_id, name, order_index) values (v_workout_id, 'Bench Press', 0) returning id into v_exercise_id;
  insert into exercise_sets (exercise_id, set_number, weight_kg, reps) values
    (v_exercise_id, 1, 80, 8),
    (v_exercise_id, 2, 80, 8),
    (v_exercise_id, 3, 80, 7);

  insert into exercise_history (user_id, exercise_name, workout_id, performed_at, best_set_weight, best_set_reps, total_volume, estimated_1rm, sets_count)
  values (v_user_id, 'Bench Press', v_workout_id, now() - interval '2 days', 80, 8, 1880, 101, 3);

  insert into exercises (workout_id, name, order_index) values (v_workout_id, 'Overhead Press', 1) returning id into v_exercise_id;
  insert into exercise_sets (exercise_id, set_number, weight_kg, reps) values
    (v_exercise_id, 1, 55, 8),
    (v_exercise_id, 2, 55, 8),
    (v_exercise_id, 3, 55, 7);

  -- Sample Pull Day
  insert into workouts (user_id, name, workout_type, started_at, finished_at, duration_minutes, energy_level)
  values (v_user_id, 'Pull Day', 'pull', now() - interval '5 days', now() - interval '5 days' + interval '65 minutes', 65, 3)
  returning id into v_workout_id;

  insert into exercises (workout_id, name, order_index) values (v_workout_id, 'Pull-ups', 0) returning id into v_exercise_id;
  insert into exercise_sets (exercise_id, set_number, weight_kg, reps) values
    (v_exercise_id, 1, 0, 10),
    (v_exercise_id, 2, 0, 9),
    (v_exercise_id, 3, 0, 8);

  insert into exercise_history (user_id, exercise_name, workout_id, performed_at, best_set_weight, best_set_reps, total_volume, estimated_1rm, sets_count)
  values (v_user_id, 'Pull-ups', v_workout_id, now() - interval '5 days', 0, 10, 0, 0, 3);

end $$;
*/
