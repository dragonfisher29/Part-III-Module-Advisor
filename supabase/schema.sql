create extension if not exists "pgcrypto";

create table if not exists public.module_advice_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  degree_route text not null,
  interests text[] not null,
  assessment_preference text not null,
  workload_preference text not null,
  career_goal text not null,
  broadening_interest boolean not null default false,
  ai_ml_interest boolean not null default false,
  theory_practice_balance text not null,
  notes text not null default '',
  recommended_semester_1 jsonb not null,
  recommended_semester_2 jsonb not null,
  balanced_plan jsonb not null
);
