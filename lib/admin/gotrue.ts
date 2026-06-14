import "server-only";

// Direct GoTrue admin API over fetch — server-only, service-role. Used for
// admin user create/delete (mirrors scripts/seed-admin.mjs) so we avoid pulling
// the realtime client into a server action.

function base() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
}
function headers() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function createAuthUser(
  email: string,
  password: string,
): Promise<{ id: string } | { error: string }> {
  const res = await fetch(`${base()}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await res.json().catch(() => null);
  if (res.ok && body?.id) return { id: body.id as string };
  if (res.status === 422 || /registered|exists/i.test(JSON.stringify(body)))
    return { error: "already_exists" };
  return { error: "create_failed" };
}

export async function deleteAuthUser(id: string): Promise<boolean> {
  const res = await fetch(`${base()}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return res.ok;
}
