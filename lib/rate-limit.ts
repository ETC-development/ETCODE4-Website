import "server-only";
import { headers } from "next/headers";

/**
 * In-process fixed-window rate limiter. Lightweight abuse-prevention for the
 * public action surface (registration, /status, admin login). Note: on
 * serverless the bucket is per-instance and resets on cold start, so this is a
 * soft speed-bump against bursts, not a hard distributed quota.
 */
const buckets = new Map<string, number[]>();

let calls = 0;
function sweep(now: number, windowMs: number) {
  for (const [k, times] of buckets) {
    if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}

export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (++calls % 500 === 0) sweep(now, windowMs);

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}
