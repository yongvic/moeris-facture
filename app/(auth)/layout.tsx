import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--paper)] px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-muted)]">
            Résidence
          </p>
          <h1 className="font-display text-3xl text-[color:var(--ink)]">
            Moeris
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Plateforme de gestion multiservice
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
