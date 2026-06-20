# IronLog

**Track. Progress. Dominate.**

A minimalist workout tracker built for progressive overload. Clean UI, fast data entry, zero noise.

---

## Stack

- **Next.js 15** — App Router, Server Actions
- **TypeScript** — strict mode
- **Tailwind CSS** — custom design tokens
- **Supabase** — Postgres + Auth + RLS
- **Zustand** — client state
- **Recharts** — minimal charts
- **date-fns** — date utilities

---

## Features

- **Workout Logging** — Push/Pull/Legs/Upper/Lower/Full Body/Custom
- **Progressive Overload** — auto-compares vs previous session, shows Δ weight / reps
- **Estimated 1RM** — Epley formula on every exercise
- **Volume Tracking** — per set, per exercise, per session
- **Workout Journal** — notes + energy level per session
- **Training Calendar** — month view with workout dots
- **Stats** — streaks, volume charts, e1RM progress, frequency heatmap
- **Fast Entry** — quick-add sets with `80 x 8` format, Tab navigation
- **Dark Mode** — default, non-negotiable

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/ironlog
cd ironlog
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon public** key

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. Database setup

In Supabase → SQL Editor, run the full contents of:

```
supabase/schema.sql
```

This creates all tables, RLS policies, and indexes.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npx vercel
```

Add the same environment variables in Vercel's project settings.

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx        # Auth guard + sidebar
│   │   ├── page.tsx          # Server: fetch data
│   │   └── client.tsx        # Client: render
│   ├── workout/
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── client.tsx
│   ├── history/
│   ├── calendar/
│   ├── stats/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Landing page
│   └── globals.css
├── components/
│   ├── layout/
│   │   └── sidebar.tsx
│   ├── ui/
│   │   └── toaster.tsx
│   ├── workout/
│   │   └── workout-form.tsx
│   └── providers.tsx
├── lib/
│   ├── actions/
│   │   ├── auth.ts
│   │   └── workouts.ts
│   ├── store/
│   │   └── workout.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils/
│       └── index.ts
├── types/
│   └── index.ts
└── middleware.ts
```

---

## Database Schema

```
workouts          — sessions with type, duration, notes, energy
exercises         — exercises within a session
exercise_sets     — individual sets (weight, reps, RPE)
exercise_history  — denormalized history for fast progress queries
```

All tables use Row Level Security — users only see their own data.

---

## Progressive Overload Logic

Each workout saves to `exercise_history` with:
- `best_set_weight` — heaviest set
- `best_set_reps` — reps on best set
- `total_volume` — sum of weight × reps
- `estimated_1rm` — Epley: `weight × (1 + reps/30)`

On the stats page, the app queries the 2 most recent sessions for each exercise and shows:
- `▲ +2.5kg` — weight increased
- `▲ +2 reps` — more reps at same weight
- `▼ Performance drop` — decreased
- `→ Same` — no change

---

## License

MIT
