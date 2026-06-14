"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

/**
 * Client nav so the active state tracks client-side navigation. The shared
 * server layout renders once and can't see route changes, which is why reading
 * the path from headers there left the highlight stuck on the first page.
 */
export default function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors duration-200",
              active
                ? "bg-orange/12 text-bone"
                : "text-bone/60 hover:bg-surface hover:text-bone",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
