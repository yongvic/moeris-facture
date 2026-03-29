export default function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-[color:var(--ink-muted)]",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
    info: "text-[color:var(--info)]",
  };

  return (
    <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface)] px-5 py-4 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-[color:var(--ink)]">
          {value}
        </p>
        {delta ? (
          <span className={`text-sm font-semibold ${toneClasses[tone]}`}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
