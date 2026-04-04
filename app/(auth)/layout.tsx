import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--paper)] px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="text-center">
          <div className="mx-auto relative h-14 w-48">
            <Image
              src="/logo_typo.png"
              alt="Résidence Moeris"
              fill
              sizes="192px"
              className="object-contain"
              priority
            />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.35em] text-[color:var(--ink-muted)]">
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
