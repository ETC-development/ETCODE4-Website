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

-- ===========================================================================
-- ADMIN (canonical end-state; mirrors supabase/migrations/0001_admin_auth.sql)
-- ===========================================================================

create table if not exists admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'manager'
              check (role in ('super_admin','manager','hr_checkin')),
  created_at  timestamptz default now()
);

-- SECURITY DEFINER role helpers: read `admins` without re-triggering RLS on it,
-- avoiding policy recursion. STABLE + pinned search_path; call as (select …).
create or replace function current_admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role from admins where id = auth.uid();
$$;

create or replace function is_admin_at_least(required text)
returns boolean language sql stable security definer set search_path = public as $$
  select case current_admin_role()
    when 'super_admin' then true
    when 'manager'     then required in ('manager','hr_checkin')
    when 'hr_checkin'  then required = 'hr_checkin'
    else false
  end;
$$;

revoke all on function current_admin_role() from public;
revoke all on function is_admin_at_least(text) from public;
grant execute on function current_admin_role() to anon, authenticated;
grant execute on function is_admin_at_least(text) to anon, authenticated;

alter table admins enable row level security;

-- managers+ read the admins directory (attribution); hr_checkin reads own row.
drop policy if exists admins_select on admins;
create policy admins_select on admins
  for select
  using ( id = (select auth.uid()) or (select is_admin_at_least('manager')) );

-- admin read access for managers+ (anon stays deny-all; registration bypasses
-- RLS via service role + join_team RPC, so it's unaffected).
drop policy if exists teams_admin_select on teams;
create policy teams_admin_select on teams
  for select using ( (select is_admin_at_least('manager')) );

drop policy if exists participants_admin_select on participants;
create policy participants_admin_select on participants
  for select using ( (select is_admin_at_least('manager')) );

-- ===========================================================================
-- OPS (canonical; mirrors supabase/migrations/0002_registration_ops.sql)
-- Review state, per-member QR, check-in, email log, audit, settings.
-- Registration is unchanged — no dietary / emergency fields collected.
-- ===========================================================================

alter table teams add column if not exists status text not null default 'pending'
  check (status in ('pending','accepted','waitlisted','rejected'));
alter table teams add column if not exists reviewed_by   uuid references admins(id);
alter table teams add column if not exists reviewed_at   timestamptz;
alter table teams add column if not exists decision_note text;
alter table teams add column if not exists internal_note text;
alter table teams add column if not exists flagged       boolean default false;
-- official codename assigned from the fixed pool (lib/team-names.ts); distinct
-- from `name` (the leader's registration name). Mirrors migration 0008.
alter table teams add column if not exists assigned_name text;
create unique index if not exists teams_assigned_name_key on teams (assigned_name);
create index if not exists teams_status_idx on teams(status);

-- per-member QR: RAW opaque token so /status (§8) can re-render it; issued/
-- revoked support reissue of lost codes.
alter table participants add column if not exists qr_token     text unique
  default encode(gen_random_bytes(9), 'hex');
alter table participants add column if not exists qr_issued_at timestamptz default now();
alter table participants add column if not exists qr_revoked_at timestamptz;

-- solo rejection (mirrors migration 0009): a rejected free-agent drops out of
-- the draft pool but the record is kept. Only meaningful for solos (team_id null).
alter table participants add column if not exists rejected_at timestamptz;
alter table participants add column if not exists rejected_by uuid references admins(id);

create table if not exists checkin_sessions (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  kind        text not null default 'general',  -- general | meal
  starts_at   timestamptz,
  is_active   boolean default false,
  sort        int default 0
);

create table if not exists check_ins (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references checkin_sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  checked_in_by  uuid references admins(id),
  checked_in_at  timestamptz default now(),
  unique (session_id, participant_id)
);
create index if not exists check_ins_session_idx on check_ins(session_id);

create table if not exists team_checkins (
  team_id      uuid references teams(id) on delete cascade,
  session_id   uuid references checkin_sessions(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (team_id, session_id)
);

create or replace function auto_complete_team_checkin()
returns trigger language plpgsql as $$
declare v_team uuid; member_count int; checked_count int;
begin
  select team_id into v_team from participants where id = new.participant_id;
  if v_team is null then return new; end if;
  select count(*) into member_count from participants where team_id = v_team;
  select count(*) into checked_count
    from check_ins ci join participants p on p.id = ci.participant_id
    where p.team_id = v_team and ci.session_id = new.session_id;
  if member_count > 0 and checked_count >= member_count then
    insert into team_checkins(team_id, session_id)
    values (v_team, new.session_id) on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_auto_team_checkin on check_ins;
create trigger trg_auto_team_checkin
  after insert on check_ins
  for each row execute function auto_complete_team_checkin();

create table if not exists emails (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references teams(id) on delete set null,
  to_email    text not null,
  template    text not null,
  status      text not null default 'queued',
  provider_id text,
  error       text,
  sent_by     uuid references admins(id),
  created_at  timestamptz default now()
);
create index if not exists emails_team_idx on emails(team_id);

create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references admins(id),
  action     text not null,
  target     text,
  meta       jsonb,
  created_at timestamptz default now()
);
create index if not exists audit_log_created_idx on audit_log(created_at desc);

create table if not exists settings (
  id                 int primary key default 1 check (id = 1),
  registration_open  boolean default true,
  max_teams          int,
  updated_at         timestamptz default now()
);
insert into settings (id) values (1) on conflict do nothing;

-- RLS on every ops table; reads via security-definer helpers, writes via the
-- service role until each feature's phase adds scoped write policies.
alter table checkin_sessions enable row level security;
alter table check_ins        enable row level security;
alter table team_checkins    enable row level security;
alter table emails           enable row level security;
alter table audit_log        enable row level security;
alter table settings         enable row level security;

drop policy if exists checkin_sessions_select on checkin_sessions;
create policy checkin_sessions_select on checkin_sessions
  for select using ( (select is_admin_at_least('hr_checkin')) );
drop policy if exists check_ins_select on check_ins;
create policy check_ins_select on check_ins
  for select using ( (select is_admin_at_least('hr_checkin')) );
drop policy if exists team_checkins_select on team_checkins;
create policy team_checkins_select on team_checkins
  for select using ( (select is_admin_at_least('hr_checkin')) );
drop policy if exists emails_select on emails;
create policy emails_select on emails
  for select using ( (select is_admin_at_least('manager')) );
drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log
  for select using ( (select is_admin_at_least('manager')) );
drop policy if exists settings_select on settings;
create policy settings_select on settings
  for select using ( (select is_admin_at_least('manager')) );

-- check-in writes (mirrors 0005): hr_checkin+ records check-ins; super_admin
-- manages sessions. App writes use the service role; these are defense in depth.
drop policy if exists check_ins_insert on check_ins;
create policy check_ins_insert on check_ins
  for insert with check ( (select is_admin_at_least('hr_checkin')) );

drop policy if exists checkin_sessions_insert on checkin_sessions;
create policy checkin_sessions_insert on checkin_sessions
  for insert with check ( (select is_admin_at_least('super_admin')) );
drop policy if exists checkin_sessions_update on checkin_sessions;
create policy checkin_sessions_update on checkin_sessions
  for update using ( (select is_admin_at_least('super_admin')) )
  with check ( (select is_admin_at_least('super_admin')) );
drop policy if exists checkin_sessions_delete on checkin_sessions;
create policy checkin_sessions_delete on checkin_sessions
  for delete using ( (select is_admin_at_least('super_admin')) );

-- ===========================================================================
-- FEEDBACK (canonical; mirrors supabase/migrations/0010_feedback.sql)
-- Post-event feedback for participants (accepted teams) + contributors
-- (organizers/mentors). Token-gated and ANONYMOUS: the submission stamp lives
-- on the recipient row; feedback_responses has no link to a person.
-- ===========================================================================

create table if not exists contributors (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  email                 text unique not null,
  role                  text not null check (role in ('organizer','mentor')),
  feedback_token        text unique default encode(gen_random_bytes(9), 'hex'),
  feedback_sent_at      timestamptz,
  feedback_submitted_at timestamptz,
  created_by            uuid references admins(id),
  created_at            timestamptz default now()
);

alter table participants add column if not exists feedback_token text unique
  default encode(gen_random_bytes(9), 'hex');
alter table participants add column if not exists feedback_sent_at      timestamptz;
alter table participants add column if not exists feedback_submitted_at timestamptz;

create table if not exists feedback_responses (
  id           uuid primary key default gen_random_uuid(),
  audience     text not null check (audience in ('participant','contributor')),
  role         text check (role in ('organizer','mentor')),
  answers      jsonb not null,
  submitted_at timestamptz default now()
);
create index if not exists feedback_responses_audience_idx
  on feedback_responses(audience, role);

-- feedback invites can target a contributor instead of a team
alter table emails add column if not exists contributor_id uuid references contributors(id);
create index if not exists emails_contributor_idx on emails(contributor_id);

alter table contributors       enable row level security;
alter table feedback_responses enable row level security;

drop policy if exists contributors_select on contributors;
create policy contributors_select on contributors
  for select using ( (select is_admin_at_least('manager')) );

drop policy if exists feedback_responses_select on feedback_responses;
create policy feedback_responses_select on feedback_responses
  for select using ( (select is_admin_at_least('manager')) );
