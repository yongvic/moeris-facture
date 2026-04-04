import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import CsvImportForm from "../../components/CsvImportForm";
import { prisma } from "../../../lib/prisma";
import { formatDate } from "../../../lib/format";
import { importEvenementsCsv } from "../actions/evenements";

const statusTone: Record<string, "info" | "warning" | "success" | "danger"> = {
  A_VENIR: "info",
  EN_COURS: "warning",
  TERMINE: "success",
  ANNULE: "danger",
};

const statusLabel: Record<string, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export default async function EvenementsPage() {
  const evenements = await prisma.evenement.findMany({
    orderBy: { dateDebut: "asc" },
    take: 12,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Événements
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Gestion des réservations
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Suivi des acomptes et des participants.
          </p>
        </div>
        <Link
          href="/evenements/nouveau"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
        >
          Nouvel événement
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 lg:grid-cols-2">
        {evenements.length === 0 ? (
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-muted)] shadow-[var(--shadow)]">
            Aucun événement planifié.
          </div>
        ) : (
          evenements.map((event) => (
            <div
              key={event.id}
              className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
                {formatDate(event.dateDebut)}
              </p>
              <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
                <Link href={`/evenements/${event.id}`} className="hover:underline">
                  {event.titre}
                </Link>
              </h3>
              <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
                Capacité: {event.capaciteMax ?? "—"} pers.
              </p>
              <div className="mt-4">
                <StatusBadge
                  tone={statusTone[event.statut] ?? "info"}
                >
                  {statusLabel[event.statut] ?? event.statut}
                </StatusBadge>
              </div>
              <Link
                href={`/evenements/${event.id}`}
                className="mt-5 block w-full rounded-full border border-[color:var(--stroke)] px-4 py-2 text-center text-sm font-semibold text-[color:var(--ink)]"
              >
                Voir les participants
              </Link>
            </div>
          ))
        )}
        </div>

        <CsvImportForm
          action={importEvenementsCsv}
          title="Import événements"
          hint="Colonnes supportées: titre, type, description, dateDebut, dateFin, capaciteMax, prixParParticipant, prixForfait, acompteRequis, statut."
        />
      </div>
    </div>
  );
}
