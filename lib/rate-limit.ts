import "server-only";
import { headers } from "next/headers";

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
