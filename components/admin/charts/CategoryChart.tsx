"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Cat } from "@/lib/admin/dashboard";
import { AXIS_TICK, ChartTooltip } from "./theme";

export default function CategoryChart({
  data,
  orientation = "vertical",
  color = "var(--orange)",
  height = 240,
  yWidth = 80,
}: {
  data: Cat[];
  orientation?: "vertical" | "horizontal";
  color?: string;
  height?: number;
  yWidth?: number;
}) {
  if (data.length === 0)
    return (
      <p
        className="grid place-items-center text-sm text-bone/40"
        style={{ height }}
      >
        No data yet.
      </p>
    );

  const horizontal = orientation === "horizontal";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={yWidth} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", opacity: 0.4 }} />
        <Bar
          dataKey="value"
          fill={color}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
