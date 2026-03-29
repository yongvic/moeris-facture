import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export default async function ReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { dateArrivee: "desc" },
    include: { client: true, chambre: true },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Réservations
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Séjours & check-in
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Vue globale des réservations en cours.
          </p>
        </div>
        <Link
          href="/reservations/nouvelle"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
        >
          Nouvelle réservation
        </Link>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Chambre</th>
                <th className="px-4 py-3 font-medium">Arrivée</th>
                <th className="px-4 py-3 font-medium">Départ</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                  >
                    Aucune réservation enregistrée.
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-t border-[color:var(--stroke)]"
                  >
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      <Link
                        href={`/reservations/${reservation.id}`}
                        className="hover:underline"
                      >
                        {reservation.client?.prenom}{" "}
                        {reservation.client?.nom ?? ""}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {reservation.chambre?.nom ?? reservation.chambre?.numero}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {new Date(reservation.dateArrivee).toLocaleDateString(
                        "fr-FR"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {new Date(reservation.dateDepart).toLocaleDateString(
                        "fr-FR"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {reservation.statut}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
