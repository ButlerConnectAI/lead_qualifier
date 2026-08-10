-- Lead Qualifier — database schema
--
-- Paste this whole file into the Supabase SQL editor and run it. It is safe to
-- run more than once: every statement either creates something that isn't there
-- or replaces what is.
--
-- WHY THIS FILE IS SECURITY-CRITICAL, not setup boilerplate:
--
-- The Supabase key the browser holds (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) is
-- public on purpose — it ships in the JavaScript bundle and anyone can read it.
-- What stops one account reading another's leads is not the key, it's the
-- row-level security policies at the bottom of this file. If RLS is off, or a
-- policy is wrong, every lead in the table is readable by anyone who opens the
-- site. There is no second line of defence behind this.
--
-- The service-role key bypasses every policy here. It is deliberately not used
-- anywhere in this project and must never be added to it. See CLAUDE.md,
-- "The secret boundary".

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- lead_runs — one row per scoring run
-- --------------------------------------------------------------------------

create table if not exists public.lead_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,

  -- The Trigger.dev run id. Unique, which is what lets the verdict be written
  -- more than once without creating duplicates — the app saves it from two
  -- independent places on purpose, and both use this column to land on the
  -- same row.
  run_id        text not null unique,

  -- The lead exactly as it was typed, so history shows what was actually
  -- scored rather than a summary of it.
  lead          jsonb not null,

  -- Null until the run finishes. Shape is VerdictSchema in src/lib/types.ts.
  verdict       jsonb,

  -- Lifted out of the verdict so the list can sort and filter without
  -- unpacking JSON on every row.
  score         integer,
  tier          text,

  -- 'abandoned' is the one that isn't obvious. Trigger.dev only keeps run
  -- records for a while. If a run finishes while nobody is watching and isn't
  -- looked at before it ages out, its verdict is gone for good — so the row is
  -- retired rather than re-checked on every history page load forever. The
  -- lead itself is never lost, because it was saved at submit time.
  status        text not null default 'pending',

  created_at    timestamptz not null default now(),
  completed_at  timestamptz,

  constraint lead_runs_status_check
    check (status in ('pending', 'complete', 'failed', 'abandoned')),
  constraint lead_runs_tier_check
    check (tier is null or tier in ('qualified', 'nurture', 'disqualified')),
  constraint lead_runs_score_check
    check (score is null or (score >= 0 and score <= 100))
);

-- The history list's only query: this user's runs, newest first.
create index if not exists lead_runs_user_created_idx
  on public.lead_runs (user_id, created_at desc);

-- --------------------------------------------------------------------------
-- Row-level security
-- --------------------------------------------------------------------------
--
-- Every policy is scoped to (select auth.uid()) = user_id, in both directions:
--   USING      — which existing rows this user may see or act on
--   WITH CHECK — what this user is allowed to write
--
-- The insert policy needs WITH CHECK specifically to stop someone writing a row
-- stamped with somebody else's user_id.

alter table public.lead_runs enable row level security;

-- Deliberately not `force row level security`. That would apply these policies
-- to the table owner as well, which is the role the Supabase SQL editor runs
-- as — so looking at your own table there would show zero rows and read as
-- data loss. The app never connects as the owner, so it would buy nothing.

drop policy if exists "lead_runs_select_own" on public.lead_runs;
create policy "lead_runs_select_own"
  on public.lead_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lead_runs_insert_own" on public.lead_runs;
create policy "lead_runs_insert_own"
  on public.lead_runs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lead_runs_update_own" on public.lead_runs;
create policy "lead_runs_update_own"
  on public.lead_runs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lead_runs_delete_own" on public.lead_runs;
create policy "lead_runs_delete_own"
  on public.lead_runs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Anonymous visitors get nothing at all. No policy grants the `anon` role any
-- access, and with RLS on, no policy means no rows.
revoke all on public.lead_runs from anon;
