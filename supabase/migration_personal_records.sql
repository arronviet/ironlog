-- ============================================================
-- IronLog — Migration: Personal Records (1RM tracking)
-- Run this in Supabase SQL Editor AFTER the main schema.sql
-- ============================================================

create table if not exists personal_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_name text not null,
  set_id uuid references exercise_sets(id) on delete set null,
  workout_id uuid references workouts(id) on delete cascade not null,
  weight_kg numeric(6,2) not null,
  reps integer not null,
  estimated_1rm numeric(6,2) not null,
  achieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- one confirmed PR per exercise per user; new PRs overwrite via upsert
  unique (user_id, exercise_name)
);

alter table personal_records enable row level security;

create policy "Users can manage own personal records"
  on personal_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_personal_records_user_id on personal_records(user_id);
create index if not exists idx_personal_records_exercise on personal_records(user_id, exercise_name);
 