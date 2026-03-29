import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { formatXof } from "../../../../lib/format";
import ChambreEditForm from "./ChambreEditForm";

export default async function ChambreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chambre = await prisma.chambre.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { dateArrivee: "desc" },
        include: { client: true },
      },
    },
  });

  if (!chambre) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Chambre introuvable.
      </div>
    );
  }

  const chambreData = {
    ...chambre,
    prixNuit: Number(chambre.prixNuit),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Chambre
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            {chambre.nom ?? chambre.numero}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            {chambre.type} • {chambre.capacite} pers. •{" "}
            {formatXof(Number(chambre.prixNuit))} / nuit
          </p>
        </div>
        <Link
          href="/reservations/nouvelle"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
        >
          Nouvelle réservation
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <h3 className="font-display text-xl text-[color:var(--ink)]">
            Informations chambre
          </h3>
          <div className="mt-4">
            <ChambreEditForm chambre={chambreData} />
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <h3 className="font-display text-xl text-[color:var(--ink)]">
            Réservations récentes
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {chambre.reservations.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
                Aucune réservation pour cette chambre.
              </div>
            ) : (
              chambre.reservations.map((res) => (
                <Link
                  key={res.id}
                  href={`/reservations/${res.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {res.client?.prenom} {res.client?.nom ?? ""}
                    </p>
                    <p className="text-xs text-[color:var(--ink-muted)]">
                      {new Date(res.dateArrivee).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(res.dateDepart).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="text-xs text-[color:var(--ink-muted)]">
                    {res.statut}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
