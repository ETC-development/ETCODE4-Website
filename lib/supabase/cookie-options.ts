import type { CookieOptions } from "@supabase/ssr";

const isProd = process.env.NODE_ENV === "production";

/**
 * Hardens the auth-session cookies before they're written.
 *
 * The admin area is server-only: sign-in runs in a Server Action and every
 * Supabase read goes through the RLS-bound server client — no browser JS ever
 * needs to read the session token. So we force:
 *   - httpOnly  → JS can't read it; an XSS payload can't exfiltrate the session
 *   - secure    → HTTPS-only in production (off in dev so http://localhost works)
 *   - sameSite  → "lax": sent on top-level navigations, blocks cross-site POST/CSRF
 *   - path "/"  → preserve the library's path (chunked auth cookies)
 * maxAge/expires from the library are preserved via the spread.
 */
export function secureCookieOptions(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: isProd,
    sameSite: options.sameSite ?? "lax",
    path: options.path ?? "/",
  };
}
