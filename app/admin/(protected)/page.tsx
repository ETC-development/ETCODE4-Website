import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/admin/dashboard";
import CountUp from "@/components/ui/CountUp";
import { Card, PageHeader, adminButton } from "@/components/admin/ui";
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
    acceptedParticipants,
  } = await getDashboardData();

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

      {/* export accepted participants, split by ENSIA membership */}
      <Card title="Export accepted participants" className="mt-6">
        <p className="text-sm text-bone/55">
          Every accepted participant with full info and their team. Split by
          whether the person is from ENSIA.
        </p>
        {acceptedParticipants.total === 0 ? (
          <p className="mt-3 text-sm text-bone/45">No accepted participants yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/admin/export?type=participants&status=accepted&institution=ENSIA"
              className={adminButton("primary")}
            >
              ↓ ENSIA ({acceptedParticipants.ensia})
            </a>
            <a
              href="/admin/export?type=participants&status=accepted&institution=ENSIA&exclude=1"
              className={adminButton("secondary")}
            >
              ↓ Outside ENSIA ({acceptedParticipants.nonEnsia})
            </a>
            <a
              href="/admin/export?type=participants&status=accepted"
              className={adminButton("secondary")}
            >
              ↓ All accepted ({acceptedParticipants.total})
            </a>
          </div>
        )}
      </Card>

      {/* primary charts */}
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

      {/* breakdown charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Accepted by institution">
          {acceptedParticipants.byInstitution.length === 0 ? (
            <p className="text-sm text-bone/55">No accepted participants yet.</p>
          ) : (
            <CategoryChart
              data={acceptedParticipants.byInstitution}
              orientation="horizontal"
              color="var(--orange)"
              yWidth={96}
            />
          )}
        </Card>
        <Card title="All applicants by institution">
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
