import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { secureCookieOptions } from "./cookie-options";

/**
 * Defense headers for the admin area (applied to every /admin response,
 * including redirects). Public routes are out of scope of the proxy matcher,
 * so they're unaffected.
 */
function harden(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY"); // no embedding admin in an iframe
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store, max-age=0"); // never cache admin pages
  return response;
}

/**
 * Refreshes the admin auth session on every /admin request and performs the
 * coarse presence gate:
 *   - no session + protected route  -> /admin/login
 *   - has session + on /admin/login -> /admin
 * Fine-grained role/route gating (super_admin vs manager vs hr_checkin) lives
 * in the (protected) layout, which already loads the admin row.
 *
 * Also injects `x-pathname` so the layout knows the current path (App Router
 * layouts don't receive it directly).
 */
export async function updateAdminSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, secureCookieOptions(options)),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() (not getSession) — it revalidates the token with the
  // auth server. Do not run any other logic between createServerClient and here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const r = NextResponse.redirect(url);
    // carry over any refreshed session cookies
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return harden(r);
  };

  if (!user && !isLogin) return redirectTo("/admin/login");
  if (user && isLogin) return redirectTo("/admin");

  return harden(response);
}
