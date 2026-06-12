import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Lock your roster for ETCODE 4: create a team, join one with a code, or sign up solo as a free agent.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04]">
        <Image src="/court/halfcourt.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>

      <header className="sticky top-0 z-40 border-b border-chalk/10 bg-court/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[80rem] items-center justify-between px-6 py-4 sm:px-10">
          <Link
            href="/"
            aria-label="ETCODE 4 home"
            className="inline-flex items-center transition-opacity duration-300 hover:opacity-80"
          >
            <Image
              src="/brand/etcode-white-mark.svg"
              alt="ETCODE 4"
              width={150}
              height={44}
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <Link
            href="/"
            className="font-body text-caption uppercase tracking-[0.18em] text-chalk/60 transition-colors hover:text-bone"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[80rem] px-6 py-16 sm:px-10 sm:py-24">
        {children}
      </main>
    </div>
  );
}
