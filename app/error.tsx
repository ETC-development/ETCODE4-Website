"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary: catches uncaught errors thrown while rendering any
// page under the root layout, so users get a branded recovery screen instead of
// a blank page. (The root layout itself is covered by app/global-error.tsx.)
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console (and any monitoring that hooks it). The
    // `digest` correlates with the server log entry for this error.
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <span
        aria-hidden
        className="pointer-events-none select-none font-display text-[clamp(7rem,7rem+16vw,22rem)] leading-none tracking-tight text-transparent"
        style={{ WebkitTextStroke: "1.5px rgba(221,119,45,0.45)" }}
      >
        TECH FOUL
      </span>

      <div className="-mt-4 sm:-mt-8">
        <p className="font-body text-caption uppercase tracking-[0.32em] text-orange">
          Whistle blown
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,1.8rem+3vw,3.6rem)] uppercase leading-none tracking-tight text-bone">
          Something broke on our end
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] font-body text-body font-light leading-relaxed text-bone/70">
          That play didn&apos;t go through. It&apos;s on us, not you. Try again,
          and if it keeps happening, reach the ETC team.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-caption text-bone/35">
            ref: {error.digest}
          </p>
        ) : null}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-orange px-6 py-3 font-body text-caption font-semibold uppercase tracking-[0.16em] text-court transition-opacity hover:opacity-90"
          >
            Try again →
          </button>
          <Link
            href="/"
            className="font-body text-caption uppercase tracking-[0.18em] text-chalk/60 transition-colors hover:text-bone"
          >
            Back to the court
          </Link>
        </div>
      </div>
    </main>
  );
}
