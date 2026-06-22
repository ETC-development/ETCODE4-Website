# Post-event feedback forms + emails — design

**Date:** 2026-06-22
**Status:** Approved (build)

## Goal

After ETCODE 4 ends, collect structured, impactful feedback from two audiences and
visualize it for the organizing team:

1. **Participants** — only members of **accepted** teams.
2. **Contributors** — people the admin imports (name/email/role); two roles:
   **organizer** and **mentor**, with role-specific questions.

Invitations are emailed exactly like the existing acceptance/rejection flow
(Nodemailer + React Email + `emails` audit log + bulk send + retry). Responses are
**anonymous**, stored in Supabase, and rendered as charts in a new admin dashboard.

## Decisions (locked with user)

- **Hosting:** built-in app page (`/feedback/[token]`), not external forms.
- **Anonymity:** the token proves eligibility and prevents double-submission, but
  the stored response carries **no identity**. The submission stamp lives on the
  recipient row; the response row has no FK to a person.
- **Contributors:** new `contributors` table; admin imports the list.
- **Role forms:** shared core questions + a role-specific block (organizer vs mentor).

## Architecture (reuses existing patterns)

| Concern | Reused / new |
| --- | --- |
| Email transport | `lib/email.ts` `sendMail` (unchanged) |
| Email template | NEW `lib/emails/FeedbackInvite.tsx` on `lib/emails/Layout.tsx` |
| Feedback email render | NEW `lib/emails/feedback.tsx` (`renderFeedbackEmail`) — no QR/attachments |
| Token-gated public page | NEW `app/(site)/feedback/[token]/` (mirrors `/status`) |
| Public submit | NEW server action, service-role client (like `getTeamStatus`) |
| Question definitions | NEW `lib/feedback/questions.ts` (shared client+server) + `lib/feedback/validate.ts` |
| Admin send + import | NEW `app/admin/(protected)/feedback/` (mirrors `emails/`) |
| Analytics | NEW `lib/admin/feedback.ts` |
| Charts | reuse Recharts `CategoryChart` + theme; NEW small NPS/stat helpers |
| Audit | `lib/admin/audit.ts` `logAudit` (unchanged) |

## Data model (migration `0010_feedback.sql` + canonical `schema.sql`)

```sql
create table contributors (
  id uuid pk default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('organizer','mentor')),
  feedback_token text unique default encode(gen_random_bytes(9),'hex'),
  feedback_sent_at timestamptz,
  feedback_submitted_at timestamptz,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

alter table participants
  add column feedback_token text unique default encode(gen_random_bytes(9),'hex'),
  add column feedback_sent_at timestamptz,
  add column feedback_submitted_at timestamptz;

create table feedback_responses (         -- ANONYMOUS: no FK to a person
  id uuid pk default gen_random_uuid(),
  audience text not null check (audience in ('participant','contributor')),
  role text check (role in ('organizer','mentor')),  -- null for participants
  answers jsonb not null,
  submitted_at timestamptz default now()
);

alter table emails add column contributor_id uuid references contributors(id);
-- emails.template is free text (no enum) → new values need no DDL.
```

RLS: new tables get RLS enabled with a managers+ select policy (consistent with the
rest of the schema). All writes go through the service-role client.

### Anti-double-submit (the anonymity lock)

Submission does a **conditional update** used as the lock, then inserts the
anonymous response:

```
update <participants|contributors>
  set feedback_submitted_at = now()
  where feedback_token = $1 and feedback_submitted_at is null
  returning id;            -- 0 rows ⇒ already submitted, abort
insert into feedback_responses(audience, role, answers) values (...);
```

Eligibility: a participant token is only valid if the team is `accepted`.

## Questions (`lib/feedback/questions.ts`)

Question types: `rating` (1–5), `nps` (0–10), `single`, `multi`, `text`.
`group` renders rating rows together (the "matrix"); `section` adds a heading.
Answers shape: `{ [questionId]: number | string | string[] }`.

**Participant:** NPS · overall satisfaction · rating matrix (problem quality,
difficulty balance, organization, venue, food, mentorship, schedule, platform) ·
difficulty (single) · met expectations · return intent · best part (multi) ·
discovery channel · 3 open-text.

**Contributor core (both roles):** overall experience · organization quality ·
communication · recommend contributing (NPS) · contribute again.
**Organizer block:** workload · role clarity · tools adequacy · coordination · 2 open.
**Mentor block:** participant skill vs expectation · briefed enough · materials
quality · participant interaction · 2 open.

## Email

`FeedbackInvite.tsx`: branded layout, personalized greeting, one CTA → personal
feedback link (`/feedback/<token>`), optional deadline line. Subjects:
- participant: "ETCODE 4 — tell us how we did"
- contributor: "ETCODE 4 — your contributor feedback"

## Admin (`/admin/feedback`, super_admin)

- KPI strip: response rate per audience/role, avg satisfaction, NPS.
- Import contributors (paste `Name, email, role` lines) → dedupe by email.
- Bulk send (participants = accepted & not yet sent; contributors = not yet sent),
  ~1 email/sec, progress + retry — same component shape as `BulkSend`.
- Charts: NPS breakdown, rating-matrix averages (horizontal bars), satisfaction
  distribution, difficulty & return-intent, discovery channel, organizer-vs-mentor
  comparison, open-text response lists.
- Nav: add "Feedback" item (super_admin) in the protected layout.

## Out of scope (YAGNI)

Editing a submitted response; reminder re-sends (the existing reminder flow is
team-only); per-question word-cloud NLP (plain text lists for now).
