import { type NextRequest } from "next/server";
import { updateAdminSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateAdminSession(request);
}

// Only the admin area needs a session. The public site (landing, /register,
// /status) is untouched, so its rendering and performance are unaffected.
export const config = {
  matcher: ["/admin/:path*"],
};
