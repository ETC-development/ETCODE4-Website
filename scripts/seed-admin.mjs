// Seed (or upsert) an admin account. Server-only: uses the service-role key,
// which must never reach the browser.
//
// Usage (Node 18+, loads .env.local for the Supabase keys):
//   node --env-file=.env.local scripts/seed-admin.mjs <email> <password> "<Full Name>" [role]
//
//   role defaults to super_admin. Valid: super_admin | manager | hr_checkin
//
// Talks to the GoTrue admin API + PostgREST directly over fetch (no
// supabase-js, so no Node-20 WebSocket requirement). Passwords are sent as
// plaintext and hashed by Supabase Auth — never pre-hash them here.

const [email, password, fullName, role = "super_admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/seed-admin.mjs <email> <password> "<Full Name>" [role]',
  );
  process.exit(1);
}
if (!["super_admin", "manager", "hr_checkin"].includes(role)) {
  console.error(`Invalid role "${role}".`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (load .env.local with --env-file).",
  );
  process.exit(1);
}

const base = url.replace(/\/$/, "");
const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function jsonOrText(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// 1) Create the auth user (email pre-confirmed so they can sign in at once).
let userId;
{
  const res = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await jsonOrText(res);

  if (res.ok) {
    userId = body.id;
    console.log(`Created auth user: ${userId}`);
  } else if (
    res.status === 422 ||
    /already.*registered|exists/i.test(JSON.stringify(body))
  ) {
    // Exists already — find the id, then (re)set the password to be safe.
    const list = await fetch(
      `${base}/auth/v1/admin/users?per_page=200`,
      { headers: authHeaders },
    );
    const data = await jsonOrText(list);
    const found = (data.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!found) {
      console.error(
        "User exists but wasn't on the first page of users. Reset via the dashboard.",
      );
      process.exit(1);
    }
    userId = found.id;
    await fetch(`${base}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ password, email_confirm: true }),
    });
    console.log(`Auth user already existed: ${userId} (password reset)`);
  } else {
    console.error("Failed to create auth user:", body);
    process.exit(1);
  }
}

// 2) Upsert the admins row (service role bypasses RLS).
{
  const res = await fetch(`${base}/rest/v1/admins?on_conflict=id`, {
    method: "POST",
    headers: { ...authHeaders, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName ?? null,
      role,
    }),
  });
  if (!res.ok) {
    console.error("Failed to upsert admins row:", await jsonOrText(res));
    process.exit(1);
  }
}

console.log(`✅ ${email} is now ${role}.`);
