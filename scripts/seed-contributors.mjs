// Seed the `contributors` table from the repo CSVs (lib/data/organizers.csv,
// lib/data/mentors.csv). Role is implied by the file. Server-only: uses the
// service-role key, which must never reach the browser.
//
// Usage (Node 18+, loads .env.local for the Supabase keys):
//   node --env-file=.env.local scripts/seed-contributors.mjs
//
// Idempotent: existing contributors (matched by email) are left untouched —
// re-running only inserts people who aren't there yet, and never resets anyone's
// feedback token or sent/submitted status. Talks to PostgREST directly over
// fetch (no supabase-js), matching scripts/seed-admin.mjs.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const SOURCES = [
  { file: "lib/data/organizers.csv", role: "organizer" },
  { file: "lib/data/mentors.csv", role: "mentor" },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (load .env.local with --env-file).",
  );
  process.exit(1);
}
const base = url.replace(/\/$/, "");
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const EMAIL_RE = /\S+@\S+\.\S+/;

// Parse "Name<sep>email" lines. Separator-agnostic: we locate the email by
// pattern and treat the rest of the line as the name. Tolerates leading/trailing
// spaces, tabs, and the odd stray comma.
function parseFile(file, role) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(EMAIL_RE);
    if (!m) {
      console.warn(`  ⚠ no email, skipped: "${line}"`);
      continue;
    }
    const email = m[0].trim().toLowerCase().replace(/[;,]+$/, "");
    const name = line
      .replace(m[0], "")
      .replace(/[\t,;]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name) {
      console.warn(`  ⚠ no name, skipped: "${line}"`);
      continue;
    }
    rows.push({ full_name: name, email, role });
  }
  return rows;
}

// Collect + de-dupe by email (first occurrence wins, organizers before mentors).
const byEmail = new Map();
for (const { file, role } of SOURCES) {
  const rows = parseFile(file, role);
  console.log(`${file}: parsed ${rows.length} ${role}(s).`);
  for (const r of rows) if (!byEmail.has(r.email)) byEmail.set(r.email, r);
}
const payload = [...byEmail.values()];
if (payload.length === 0) {
  console.error("Nothing to import.");
  process.exit(1);
}

// Insert, ignoring rows whose email already exists (DO NOTHING). With
// return=representation, the response holds only the rows actually inserted.
const res = await fetch(
  `${base}/rest/v1/contributors?on_conflict=email`,
  {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(payload),
  },
);

if (!res.ok) {
  console.error("Insert failed:", await res.text());
  process.exit(1);
}

const inserted = await res.json();
const insertedCount = Array.isArray(inserted) ? inserted.length : 0;
const skipped = payload.length - insertedCount;
const byRole = (role) => payload.filter((r) => r.role === role).length;

console.log(
  `\n✅ contributors: ${insertedCount} added, ${skipped} already present ` +
    `(${byRole("organizer")} organizers, ${byRole("mentor")} mentors in source).`,
);
