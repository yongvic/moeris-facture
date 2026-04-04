import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { prisma } from "../../../lib/prisma";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  CONFIRMEE: "neutral",
  CHECK_IN_EFFECTUE: "warning",
  CHECK_OUT_EFFECTUE: "success",
  ANNULEE: "danger",
  NO_SHOW: "danger",
};

type SearchParams = Promise<{
  q?: string;
  statut?: string;
}>;

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const statut = filters.statut?.trim() ?? "";

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(statut
        ? {
            statut: statut as
              | "CONFIRMEE"
              | "CHECK_IN_EFFECTUE"
              | "CHECK_OUT_EFFECTUE"
              | "ANNULEE"
              | "NO_SHOW",
          }
        : {}),
      ...(q
        ? {
            OR: [
              { client: { prenom: { contains: q, mode: "insensitive" } } },
              { client: { nom: { contains: q, mode: "insensitive" } } },
              { chambre: { nom: { contains: q, mode: "insensitive" } } },
              { chambre: { numero: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
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
            Vue globale avec filtres exploitables et suivi métier.
          </p>
        </div>
        <Link
          href="/reservations/nouvelle"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
        >
          Nouvelle réservation
        </Link>
      </div>

      <form className="grid gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Recherche
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Client ou chambre"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Statut
          <select
            name="statut"
            defaultValue={statut}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          >
            <option value="">Tous</option>
            <option value="CONFIRMEE">Confirmée</option>
            <option value="CHECK_IN_EFFECTUE">Check-in effectué</option>
            <option value="CHECK_OUT_EFFECTUE">Check-out effectué</option>
            <option value="ANNULEE">Annulée</option>
            <option value="NO_SHOW">No-show</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

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
                    Aucune réservation trouvée avec ces filtres.
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
                        {reservation.client?.prenom} {reservation.client?.nom ?? ""}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {reservation.chambre?.nom ?? reservation.chambre?.numero}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {new Date(reservation.dateArrivee).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {new Date(reservation.dateDepart).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusTone[reservation.statut] ?? "neutral"}>
                        {reservation.statut}
                      </StatusBadge>
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
