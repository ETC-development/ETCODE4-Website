"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
    }
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
        aria-live="polite"
        className="flex items-center justify-center gap-2 rounded-2xl border border-chalk/25 px-6 py-5 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:border-orange hover:text-orange"
      >
        {copied ? "Copied ✓" : "Copy code"}
      </button>
    </div>
  );
}
