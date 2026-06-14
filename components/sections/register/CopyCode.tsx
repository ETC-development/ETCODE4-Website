"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      // Clipboard API unavailable (non-HTTPS / permission / old browser).
      // The code is select-all, so guide the user to copy it manually.
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="flex-1 rounded-2xl border border-orange/40 bg-orange/10 px-6 py-5 text-center">
        <span className="select-all font-display text-[clamp(2rem,1.4rem+3vw,3.2rem)] uppercase tracking-[0.15em] text-orange">
          {code}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        data-cursor="target"
        className="flex items-center justify-center gap-2 rounded-2xl border border-chalk/25 px-6 py-5 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:border-orange hover:text-orange"
      >
        {status === "copied"
          ? "Copied ✓"
          : status === "failed"
            ? "Select & copy ↑"
            : "Copy code"}
      </button>
      {/* live region separate from the button so the result is announced reliably */}
      <span aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Team code copied to clipboard."
          : status === "failed"
            ? "Copy failed. Select the code above to copy it manually."
            : ""}
      </span>
    </div>
  );
}
