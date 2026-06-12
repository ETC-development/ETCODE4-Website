"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function InviteLink({ code }: { code: string }) {
  const link = useSyncExternalStore(
    subscribe,
    () => `${window.location.origin}/register/join-team?code=${encodeURIComponent(code)}`,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 rounded-2xl border border-chalk/20 bg-court/50 px-5 py-4">
        <span className="block truncate font-body text-caption text-chalk/80">
          {link || "Building your invite link…"}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        data-cursor="target"
        aria-live="polite"
        className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-chalk/25 px-6 py-4 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:border-orange hover:text-orange"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
