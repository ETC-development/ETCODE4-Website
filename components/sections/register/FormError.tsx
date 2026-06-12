"use client";

import { useEffect, useRef } from "react";

export default function FormError({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }, [message]);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-3 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3.5 outline-none"
    >
      <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange font-display text-[0.7rem] text-court">
        !
      </span>
      <p className="font-body text-body text-bone/90">{message}</p>
    </div>
  );
}
