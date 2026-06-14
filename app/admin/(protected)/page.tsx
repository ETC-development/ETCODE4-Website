import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/admin/dashboard";
import CountUp from "@/components/ui/CountUp";
import StatusChip from "@/components/admin/StatusChip";
import { Card, PageHeader } from "@/components/admin/ui";
import RegistrationsChart from "@/components/admin/charts/RegistrationsChart";
import StatusFunnel from "@/components/admin/charts/StatusFunnel";
import CategoryChart from "@/components/admin/charts/CategoryChart";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-bone/10 bg-surface px-4 py-3">
      <p
        className={`font-display text-4xl tabular-nums ${accent ? "text-orange" : "text-bone"}`}
      >
        <CountUp value={value} />
      </p>
      <p className="mt-1 font-body text-caption uppercase tracking-wide text-bone/60">
        {label}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  await requireRole("manager");
  const {
    kpis,
    statusCounts,
    completeness,
    registrations,
    institutions,
    studyYears,
    tshirts,
    needsAttention,
  } = await getDashboardData();
  const hasAttention =
    needsAttention.flagged.length > 0 || needsAttention.partial.length > 0;

  return (
    <section>
      <PageHeader title="Dashboard" />

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Teams" value={String(kpis.totalTeams)} />
        <Kpi label="Participants" value={String(kpis.totalParticipants)} />
        <Kpi label="Pending" value={String(kpis.pending)} />
        <Kpi label="Accepted" value={String(kpis.accepted)} accent />
        <Kpi label="Waitlisted" value={String(kpis.waitlisted)} />
        <Kpi
          label={kpis.maxTeams ? `Capacity (/${kpis.maxTeams})` : "Capacity"}
          value={kpis.capacityFillPct === null ? "n/a" : `${kpis.capacityFillPct}%`}
          accent
        />
        <Kpi label="Solo agents" value={String(kpis.soloFreeAgents)} />
      </div>

      {/* needs attention */}
      {hasAttention ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card title={`Flagged teams (${needsAttention.flagged.length})`}>
            {needsAttention.flagged.length === 0 ? (
              <p className="text-sm text-bone/55">None flagged.</p>
            ) : (
              <ul className="space-y-1.5">
                {needsAttention.flagged.map((t) => (
                  <li key={t.code}>
                    <Link
                      href={`/admin/teams/${t.code}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                    >
                      <span className="min-w-0 truncate text-bone">
                        {t.name}{" "}
                        <span className="text-caption text-bone/55">{t.code}</span>
                      </span>
                      <StatusChip status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={`Partial rosters · pending (${needsAttention.partial.length})`}>
            {needsAttention.partial.length === 0 ? (
              <p className="text-sm text-bone/55">All pending teams are full.</p>
            ) : (
              <ul className="space-y-1.5">
                {needsAttention.partial.map((t) => (
                  <li key={t.code}>
                    <Link
                      href={`/admin/teams/${t.code}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                    >
                      <span className="min-w-0 truncate text-bone">
                        {t.name}{" "}
                        <span className="text-caption text-bone/55">{t.code}</span>
                      </span>
                      <span className="text-caption font-medium text-orange">
                        {t.members}/3
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {/* charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Registrations over time">
          <RegistrationsChart data={registrations} />
        </Card>
        <Card title="Status funnel">
          <StatusFunnel total={kpis.totalTeams} statusCounts={statusCounts} />
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-body text-caption uppercase tracking-[0.16em] text-bone/55">
          Team completeness
        </span>
        <span className="rounded-full border border-bone/10 bg-surface px-3 py-1 text-bone/80">
          <strong className="text-bone">{completeness.full}</strong> full
        </span>
        <span className="rounded-full border border-bone/10 bg-surface px-3 py-1 text-bone/80">
          <strong className="text-bone">{completeness.partial}</strong> partial
        </span>
        <span className="rounded-full border border-bone/10 bg-surface px-3 py-1 text-bone/80">
          <strong className="text-bone">{completeness.solos}</strong> solo
          free-agents
        </span>
      </div>

      {/* secondary charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Institutions (top 8)">
          <CategoryChart
            data={institutions}
            orientation="horizontal"
            color="var(--blue)"
            yWidth={96}
          />
        </Card>
        <Card title="Study year">
          <CategoryChart data={studyYears} color="var(--orange)" />
        </Card>
        <Card title="T-shirt sizes (procurement)">
          <CategoryChart data={tshirts} color="var(--blue)" />
        </Card>
      </div>
    </section>
  );
}
