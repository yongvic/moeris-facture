import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";

const statusTone: Record<string, "success" | "info" | "danger" | "warning"> = {
  DISPONIBLE: "success",
  OCCUPEE: "info",
  MAINTENANCE: "danger",
  HORS_SERVICE: "warning",
};

export default async function ChambresPage() {
  const chambres = await prisma.chambre.findMany({
    orderBy: { numero: "asc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Hébergement
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Inventaire des chambres
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Vue exploitable des statuts, capacités et tarifs réellement
            configurés.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/chambres/nouveau"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Ajouter chambre
          </Link>
          <Link
            href="/reservations/nouvelle"
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
          >
            Nouvelle réservation
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Chambre</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Capacité</th>
                <th className="px-4 py-3 font-medium">Prix / nuit</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
          {chambres.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                >
                  Aucune chambre enregistrée.
                </td>
              </tr>
          ) : (
            chambres.map(
              (chambre) => (
                <tr
                  key={chambre.id}
                  className="border-t border-[color:var(--stroke)]"
                >
                  <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                    <Link
                      href={`/chambres/${chambre.id}`}
                      className="hover:underline"
                    >
                      {chambre.nom ?? chambre.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {chambre.type}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {chambre.capacite} pers.
                  </td>
                  <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                    {formatXof(Number(chambre.prixNuit))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone[chambre.statut] ?? "info"}>
                      {chambre.statut}
                    </StatusBadge>
                  </td>
                </tr>
              )
            )
          )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
