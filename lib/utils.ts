import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genTeamCode(length = 5): string {
  let body = "";
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    body += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `ET4-${body}`;
}

export function normalizeTeamCode(code: string): string {
  return code.trim().toUpperCase();
}

export function pad2(n: number): string {
  return Math.max(0, Math.floor(n)).toString().padStart(2, "0");
}

export function sectionNo(n: number): string {
  return n.toString().padStart(2, "0");
}

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
  total: number;
};

export function countdownTo(targetISO: string, fromMs: number): Countdown {
  const total = new Date(targetISO).getTime() - fromMs;
  const clamped = Math.max(0, total);
  const days = Math.floor(clamped / 86_400_000);
  const hours = Math.floor((clamped % 86_400_000) / 3_600_000);
  const minutes = Math.floor((clamped % 3_600_000) / 60_000);
  const seconds = Math.floor((clamped % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: total <= 0, total };
}

/**
 * Returns the URL only if it's a safe http(s) link, else null. Guards against
 * `javascript:`/`data:` URLs in user-supplied handles (LeetCode/HackerRank/
 * GitHub) being rendered into an `href` — a stored-XSS vector in the admin UI.
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function formatEventDate(iso: string, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Algiers",
  }).format(new Date(iso));
}
