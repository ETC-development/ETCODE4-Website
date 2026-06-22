"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FeedbackAdminData } from "@/lib/admin/feedback";
import FeedbackCharts from "./FeedbackCharts";

type Tab = "participant" | "organizer" | "mentor";

export default function AnalyticsTabs({
  analytics,
}: {
  analytics: FeedbackAdminData["analytics"];
}) {
  const [tab, setTab] = useState<Tab>("participant");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "participant", label: "Participants", count: analytics.participantResponses },
    { key: "organizer", label: "Organizers", count: analytics.organizerResponses },
    { key: "mentor", label: "Mentors", count: analytics.mentorResponses },
  ];

  const current = {
    participant: { stats: analytics.participant, responses: analytics.participantResponses },
    organizer: { stats: analytics.organizer, responses: analytics.organizerResponses },
    mentor: { stats: analytics.mentor, responses: analytics.mentorResponses },
  }[tab];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-caption font-semibold uppercase tracking-wide transition-colors",
              tab === t.key
                ? "border-orange bg-orange/12 text-bone"
                : "border-bone/15 text-bone/60 hover:border-orange/40 hover:text-bone",
            )}
          >
            {t.label}
            <span className="ml-2 rounded-full bg-court px-1.5 py-0.5 text-bone/55 tabular-nums">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <FeedbackCharts
        key={tab}
        stats={current.stats}
        responses={current.responses}
        emptyLabel={`No ${tab} responses yet. They'll appear here as people submit.`}
      />
    </div>
  );
}
