"use client";

// Shared chart theming — brand tokens via CSS vars (no raw hex in components).
export const SERIES = {
  orange: "var(--orange)",
  blue: "var(--blue)",
  chalk: "var(--chalk)",
  muted: "var(--text-tertiary)",
} as const;

export const AXIS_TICK = { fill: "var(--text-tertiary)", fontSize: 11 };

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-bone/15 bg-surface-2 px-3 py-2 text-caption shadow-lg">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-bone">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <p key={i} className="text-bone/75">
          <span style={{ color: p.color }}>●</span> {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}
