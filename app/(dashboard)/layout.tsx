import type { ReactNode } from "react";
import Link from "next/link";
import SidebarNav from "../components/SidebarNav";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col gap-8 border-r border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-6 py-8 md:flex">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
              Résidence
            </span>
            <span className="font-display text-2xl text-[color:var(--ink)]">
              Moeris
            </span>
          </div>
          <SidebarNav />
          <div className="mt-auto rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface)] px-4 py-4 text-sm">
            <p className="text-[color:var(--ink-muted)]">
              Session active
            </p>
            <p className="mt-2 font-semibold text-[color:var(--ink)]">
              {user?.name ?? "Utilisateur"}
            </p>
            <p className="text-xs text-[color:var(--ink-muted)]">{user?.role ?? "Staff"}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[color:var(--stroke)] bg-[color:var(--paper)]/95 px-4 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--ink-muted)]">
                Suite opérationnelle
              </p>
              <h1 className="font-display text-2xl text-[color:var(--ink)]">
                Centre de pilotage
              </h1>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="flex w-full items-center gap-2 rounded-full border border-[color:var(--stroke)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--ink-muted)] md:w-72">
                <span className="text-xs">⌕</span>
                <input
                  placeholder="Rechercher client, facture, chambre..."
                  className="w-full bg-transparent text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Link
                  href="/factures"
                  className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
                >
                  Voir les factures
                </Link>
                <Link
                  href="/factures"
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--accent-strong)]"
                >
                  Nouvelle facture
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[color:var(--stroke)] bg-[color:var(--surface)] px-3 py-3 text-xs text-[color:var(--ink-muted)] md:hidden">
        <Link href="/dashboard" className="font-semibold text-[color:var(--ink)]">
          Dashboard
        </Link>
        <Link href="/clients">Clients</Link>
        <Link href="/factures">Factures</Link>
        <Link href="/restaurant/pos">POS</Link>
        <Link href="/settings">Admin</Link>
      </nav>
    </div>
  );
}
