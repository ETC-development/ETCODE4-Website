"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RegPoint } from "@/lib/admin/dashboard";
import { AXIS_TICK, ChartTooltip, SERIES } from "./theme";

export default function RegistrationsChart({ data }: { data: RegPoint[] }) {
  if (data.length === 0)
    return (
      <p className="grid h-[260px] place-items-center text-sm text-bone/40">
        No registrations yet.
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.orange} stopOpacity={0.35} />
            <stop offset="100%" stopColor={SERIES.orange} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", opacity: 0.4 }} />
        <Bar dataKey="daily" name="Daily" fill={SERIES.blue} radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Total"
          stroke={SERIES.orange}
          strokeWidth={2}
          fill="url(#cumFill)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
