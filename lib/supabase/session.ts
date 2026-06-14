import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { secureCookieOptions } from "./cookie-options";

/**
 * Authenticated, cookie-bound Supabase client for the admin area.
 *
 * Carries the signed-in admin's session, so `auth.uid()` resolves and RLS
 * policies (admins / teams / participants) apply. This is the ONLY client the
 * admin UI reads through — the service-role client (lib/supabase/server.ts)
 * stays for privileged, RLS-bypassing writes and never touches the browser.
 *
 * In a Server Component `cookieStore.set` throws (read-only context); we
 * swallow it and rely on middleware (lib/supabase/middleware.ts) to refresh
 * the session cookie on every request.
 */
export async function supabaseSession() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, secureCookieOptions(options)),
            );
          } catch {
            // called from a Server Component — middleware handles the refresh
          }
        },
      },
    },
  );
}
