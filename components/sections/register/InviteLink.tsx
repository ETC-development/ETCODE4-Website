"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function InviteLink({ code }: { code: string }) {
  const link = useSyncExternalStore(
    subscribe,
    () => `${window.location.origin}/register/join-team?code=${encodeURIComponent(code)}`,
    () => "",
  );
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const flash = (s: "copied" | "failed") => {
    setStatus(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 3000);
  };

  const copy = async () => {
    if (!link) return;
    // Prefer the native share sheet on mobile (hand off to WhatsApp/Messages),
    // fall back to clipboard, and finally tell the user to copy it manually.
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title: "Join my ETCODE 4 team", url: link });
        return;
      }
    } catch {
      // user dismissed the share sheet — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(link);
      flash("copied");
    } catch {
      flash("failed");
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 select-all rounded-2xl border border-chalk/20 bg-court/50 px-5 py-4">
        <span className="block truncate font-body text-caption text-chalk/80">
          {link || "Building your invite link…"}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        data-cursor="target"
        className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-chalk/25 px-6 py-4 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 hover:border-orange hover:text-orange"
      >
        {status === "copied"
          ? "Copied ✓"
          : status === "failed"
            ? "Select & copy ↑"
            : "Share link"}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Invite link copied to clipboard."
          : status === "failed"
            ? "Copy failed. Select the link to copy it manually."
            : ""}
      </span>
    </div>
  );
}
