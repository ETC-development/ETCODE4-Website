-- ETCODE 4 — registration schema (DESIGN.md §6.4 / CLAUDE.md data model)
-- Run this in the Supabase SQL editor, then paste your keys into .env.local.
-- Teams are EXACTLY 3; the cap is enforced atomically in join_team(), never
-- with a read-then-write race in JS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  team_code   text unique not null,          -- e.g. ET4-7KQ2X
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists participants (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references teams(id) on delete set null,  -- null = solo / unassigned
  role        text not null check (role in ('leader','member','solo')),
  full_name   text not null,
  email       text unique not null,
  phone       text,
  institution text,
  study_year  text,
  leetcode    text,
  hackerrank  text,
  github      text,
  motivation  text,                            -- leader's / solo's pitch
  tshirt_size text,
  created_at  timestamptz default now()
);

-- if upgrading an existing install:
alter table participants add column if not exists leetcode text;
alter table participants add column if not exists hackerrank text;
alter table participants add column if not exists github text;
alter table participants add column if not exists motivation text;

create index if not exists participants_team_id_idx on participants(team_id);

-- ---------------------------------------------------------------------------
-- atomic join: enforce max 3 per team in one statement, friendly errors
-- ---------------------------------------------------------------------------
create or replace function join_team(p_code text, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t teams;
  n int;
begin
  -- lock the team ROW so concurrent joiners serialize here and can't both pass
  -- the cap check (FOR UPDATE on a single row is valid; on count(*) it is not)
  select * into t from teams where team_code = upper(p_code) for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'code_not_found');
  end if;

  select count(*) into n
  from participants
  where team_id = t.id;

  if n >= 3 then
    return jsonb_build_object('ok', false, 'error', 'team_full');
  end if;

  begin
    insert into participants(team_id, role, full_name, email, phone, institution, study_year, leetcode, hackerrank, github, tshirt_size)
    values (
      t.id, 'member',
      p->>'full_name', p->>'email', p->>'phone', p->>'institution',
      p->>'study_year',
      nullif(p->>'leetcode', ''), nullif(p->>'hackerrank', ''),
      nullif(p->>'github', ''),
      nullif(p->>'tshirt_size', '')
    );
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'email_taken');
  end;

  return jsonb_build_object('ok', true, 'team', t.name, 'count', n + 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: lock everything to the server. All writes go through Server Actions
-- (service-role key, server-only) or the security-definer join_team RPC.
-- The anon key gets no direct table access.
-- ---------------------------------------------------------------------------
alter table teams        enable row level security;
alter table participants enable row level security;

-- (no policies for anon = deny all direct access; service role bypasses RLS)

-- allow the anon key to call the join RPC only
grant execute on function join_team(text, jsonb) to anon, authenticated;
