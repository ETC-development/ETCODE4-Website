"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamStatus } from "@/lib/admin/types";
import { AXIS_TICK, ChartTooltip, SERIES } from "./theme";

const COLOR: Record<string, string> = {
  Registered: SERIES.chalk,
  Pending: SERIES.chalk,
  Accepted: SERIES.orange,
  Waitlisted: SERIES.blue,
  Rejected: SERIES.muted,
};

export default function StatusFunnel({
  total,
  statusCounts,
}: {
  total: number;
  statusCounts: Record<TeamStatus, number>;
}) {
  const data = [
    { name: "Registered", value: total },
    { name: "Pending", value: statusCounts.pending },
    { name: "Accepted", value: statusCounts.accepted },
    { name: "Waitlisted", value: statusCounts.waitlisted },
    { name: "Rejected", value: statusCounts.rejected },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={78}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", opacity: 0.4 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
          {data.map((d) => (
            <Cell key={d.name} fill={COLOR[d.name]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
