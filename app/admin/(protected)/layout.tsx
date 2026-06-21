import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin, roleAtLeast, type AdminRole } from "@/lib/auth";
import { ToastProvider } from "@/components/admin/Toast";
import AdminNav from "./AdminNav";
import { signOut } from "../actions";

// hr_checkin is allowed only on these route prefixes; every other admin route
// bounces them back to check-in (ADMIN.md §1, §7).
const HR_CHECKIN_ALLOWED = ["/admin/checkin", "/admin/board"];

type NavItem = { href: string; label: string; min: AdminRole };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", min: "manager" },
  { href: "/admin/teams", label: "Review", min: "manager" },
  { href: "/admin/accepted", label: "Accepted", min: "super_admin" },
  { href: "/admin/draft", label: "Draft", min: "manager" },
  { href: "/admin/checkin", label: "Check-in", min: "hr_checkin" },
  { href: "/admin/board", label: "Live board", min: "hr_checkin" },
  { href: "/admin/emails", label: "Emails", min: "super_admin" },
  { href: "/admin/audit", label: "Activity", min: "manager" },
  { href: "/admin/settings", label: "Settings", min: "super_admin" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (admin.role === "hr_checkin") {
    const allowed = HR_CHECKIN_ALLOWED.some((p) => pathname.startsWith(p));
    if (!allowed) redirect("/admin/checkin");
  }

  const nav = NAV.filter((item) => roleAtLeast(admin.role, item.min)).map(
    (item) => ({ href: item.href, label: item.label }),
  );

  return (
    <ToastProvider>
    <div className="min-h-dvh bg-court text-bone">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-bone/10 bg-court/85 px-4 py-3 backdrop-blur sm:px-6 sm:py-3.5">
        <Link
          href="/admin"
          className="shrink-0 font-display text-lg uppercase tracking-wide"
        >
          ETCODE 4<span className="text-orange"> · ops</span>
        </Link>
        <AdminNav items={nav} />
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-bone/45">
            <span className="hidden sm:inline">{admin.email} · </span>
            <span className="font-medium text-orange">{admin.role}</span>
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-bone/15 px-3 py-1.5 text-bone/80 transition-colors hover:border-bone/30 hover:text-bone"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
    </ToastProvider>
  );
}
