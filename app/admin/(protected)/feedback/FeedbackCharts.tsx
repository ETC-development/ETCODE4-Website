"use client";

import { useState } from "react";
import CategoryChart from "@/components/admin/charts/CategoryChart";
import { Card } from "@/components/admin/ui";
import type { QStat } from "@/lib/admin/feedback";

function NpsCard({ stat }: { stat: Extract<QStat, { kind: "scale" }> }) {
  const n = stat.nps;
  if (!n || stat.count === 0)
    return (
      <Card title="Net Promoter Score">
        <p className="text-sm text-bone/45">No responses yet.</p>
      </Card>
    );
  const pct = (x: number) => (stat.count ? Math.round((x / stat.count) * 100) : 0);
  const segs = [
    { label: "Promoters", val: n.promoters, color: "var(--orange)" },
    { label: "Passives", val: n.passives, color: "var(--chalk)" },
    { label: "Detractors", val: n.detractors, color: "var(--text-tertiary)" },
  ];
  return (
    <Card title="Net Promoter Score">
      <div className="flex items-end gap-3">
        <span className="font-display text-5xl tabular-nums text-orange">{n.score}</span>
        <span className="pb-1 text-caption text-bone/50">
          NPS · {stat.count} response{stat.count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-court">
        {segs.map((s) =>
          s.val > 0 ? (
            <div key={s.label} style={{ width: `${pct(s.val)}%`, backgroundColor: s.color }} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-caption">
        {segs.map((s) => (
          <li key={s.label} className="text-bone/60">
            <span style={{ color: s.color }}>●</span> {s.label}
            <span className="ml-1 text-bone/80">
              {s.val} ({pct(s.val)}%)
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TextResponses({ stat }: { stat: Extract<QStat, { kind: "text" }> }) {
  const [open, setOpen] = useState(false);
  const shown = open ? stat.responses : stat.responses.slice(0, 5);
  return (
    <Card title={stat.label}>
      {stat.count === 0 ? (
        <p className="text-sm text-bone/45">No responses yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {shown.map((r, i) => (
              <li
                key={i}
                className="rounded-lg border border-bone/8 bg-court px-3 py-2 text-sm text-bone/80"
              >
                {r}
              </li>
            ))}
          </ul>
          {stat.responses.length > 5 ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-3 text-caption font-semibold uppercase tracking-wide text-orange"
            >
              {open ? "Show less" : `Show all ${stat.responses.length}`}
            </button>
          ) : null}
        </>
      )}
    </Card>
  );
}

export default function FeedbackCharts({
  stats,
  responses,
  emptyLabel,
}: {
  stats: QStat[];
  responses: number;
  emptyLabel: string;
}) {
  if (responses === 0) {
    return (
      <div className="rounded-xl border border-dashed border-bone/12 px-4 py-10 text-center text-sm text-bone/50">
        {emptyLabel}
      </div>
    );
  }

  const scales = stats.filter(
    (s): s is Extract<QStat, { kind: "scale" }> => s.kind === "scale",
  );
  const nps = scales.find((s) => s.type === "nps");
  const ratings = scales.filter((s) => s.type === "rating");
  const choices = stats.filter(
    (s): s is Extract<QStat, { kind: "choice" }> => s.kind === "choice",
  );
  const texts = stats.filter(
    (s): s is Extract<QStat, { kind: "text" }> => s.kind === "text",
  );

  const ratingAverages = ratings
    .filter((s) => s.avg !== null)
    .map((s) => ({ name: s.label, value: s.avg as number }));

  return (
    <div className="flex flex-col gap-5">
      {/* top row: NPS + rating averages */}
      <div className="grid gap-5 lg:grid-cols-2">
        {nps ? <NpsCard stat={nps} /> : null}
        {ratingAverages.length ? (
          <Card title="Average ratings (out of 5)">
            <CategoryChart
              data={ratingAverages}
              orientation="horizontal"
              color="var(--orange)"
              yWidth={150}
              height={Math.max(200, ratingAverages.length * 30)}
            />
          </Card>
        ) : null}
      </div>

      {/* choice questions */}
      {choices.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {choices.map((s) => (
            <Card key={s.id} title={s.label}>
              <CategoryChart
                data={s.options}
                orientation={s.options.length > 4 ? "horizontal" : "vertical"}
                color="var(--blue)"
                yWidth={140}
                height={s.options.length > 4 ? Math.max(180, s.options.length * 30) : 220}
              />
            </Card>
          ))}
        </div>
      ) : null}

      {/* free text */}
      {texts.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {texts.map((s) => (
            <TextResponses key={s.id} stat={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
