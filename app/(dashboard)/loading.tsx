export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`stat-${index}`}
            className="h-28 animate-pulse rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)]"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="h-80 animate-pulse rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)]" />
        <div className="h-80 animate-pulse rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)]" />
      </div>
    </div>
  );
}
