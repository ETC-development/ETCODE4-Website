// Shared skeleton for admin route transitions — every protected page is
// force-dynamic and awaits data, so this fills the gap instead of a blank screen.
function Bar({ className }: { className?: string }) {
  return (
    <div
      className={`motion-safe:animate-pulse rounded-md bg-surface-2 ${className ?? ""}`}
    />
  );
}

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <Bar className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-bone/10 bg-surface px-4 py-3"
          >
            <Bar className="h-9 w-16" />
            <Bar className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-bone/10 bg-surface p-5">
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-48 w-full" />
        </div>
        <div className="rounded-2xl border border-bone/10 bg-surface p-5">
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
