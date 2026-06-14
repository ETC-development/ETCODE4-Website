// Pure CSV helpers (RFC-4180 quoting), unit-testable in isolation.
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // CSV-injection guard: a cell beginning with = + - @ (or a leading tab/CR)
  // is interpreted as a formula by Excel/Sheets. Participant-supplied fields
  // (names, team names) are untrusted, so neutralize with a leading apostrophe.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
