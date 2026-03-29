import type { ReactNode } from "react";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[color:rgba(5,150,105,0.16)] text-[color:var(--success)]",
  warning: "bg-[color:rgba(217,119,6,0.18)] text-[color:var(--warning)]",
  danger: "bg-[color:rgba(220,38,38,0.16)] text-[color:var(--danger)]",
  info: "bg-[color:rgba(37,99,235,0.16)] text-[color:var(--info)]",
  neutral: "bg-[color:rgba(43,36,24,0.08)] text-[color:var(--ink-muted)]",
};

export default function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
