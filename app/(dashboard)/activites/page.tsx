import Link from "next/link";
import type { Activite } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";

export default async function ActivitesPage() {
  const activites: Activite[] = await prisma.activite.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Loisirs
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Activités & packs
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Tarifs par unité, capacité et gratuités configurables.
          </p>
        </div>
        <Link
          href="/activites/nouvelle"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
        >
          Nouvelle activité
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {activites.length === 0 ? (
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-muted)] shadow-[var(--shadow)]">
            Aucune activité configurée.
          </div>
        ) : (
          activites.map((activite) => (
            <div
              key={activite.id}
              className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
                Activité
              </p>
              <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
                <Link href={`/activites/${activite.id}`} className="hover:underline">
                  {activite.nom}
                </Link>
              </h3>
              <div className="mt-4 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
                <span>Tarif</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {formatXof(Number(activite.prix))}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
                <span>Unité</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {activite.prixParUnite ?? "personne"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
                <span>Capacité</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {activite.capaciteMax ?? "—"} pers.
                </span>
              </div>
              <button className="mt-5 w-full rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
                Ajouter à une facture
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
