// Fixed-timezone formatters so server and client render identically (no
// hydration drift) and times read in the event's local zone.
const TZ = "Africa/Algiers";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

export function fmtDateTime(iso: string | null): string {
  return iso ? dateTime.format(new Date(iso)) : "n/a";
}

export function fmtDate(iso: string | null): string {
  return iso ? dateOnly.format(new Date(iso)) : "n/a";
}
