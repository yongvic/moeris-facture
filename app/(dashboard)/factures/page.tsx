import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  OUVERTE: "neutral",
  PARTIELLEMENT_PAYEE: "warning",
  PAYEE: "success",
  ANNULEE: "danger",
};

const statusLabel: Record<string, string> = {
  OUVERTE: "Ouverte",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const typeLabel = (facture: {
  reservationId: string | null;
  evenementId: string | null;
}) => {
  if (facture.evenementId) return "Événement";
  if (facture.reservationId) return "Séjour";
  return "Simple";
};

export default async function FacturesPage() {
  const factures = await prisma.facture.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Facturation
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Suivi des factures
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Création rapide, paiements partiels et export PDF.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
            <button className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
              Encaissement rapide
            </button>
            <Link
              href="/api/exports/factures"
              className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
            >
              Export CSV
            </Link>
          <Link
            href="/factures/nouvelle"
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
          >
            Nouvelle facture
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-2 text-sm text-[color:var(--ink-muted)]">
            <span className="text-xs">⌕</span>
            <input
              placeholder="Rechercher une facture, un client, un service..."
              className="w-full bg-transparent text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <button className="rounded-full border border-[color:var(--stroke)] px-3 py-2 font-semibold text-[color:var(--ink)]">
              Statut
            </button>
            <button className="rounded-full border border-[color:var(--stroke)] px-3 py-2 font-semibold text-[color:var(--ink)]">
              Période
            </button>
            <button className="rounded-full border border-[color:var(--stroke)] px-3 py-2 font-semibold text-[color:var(--ink)]">
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Facture</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {factures.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                  >
                    Aucune facture créée pour le moment.
                  </td>
                </tr>
              ) : (
                factures.map((facture) => (
                <tr key={facture.id} className="border-t border-[color:var(--stroke)]">
                  <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                    <Link
                      href={`/factures/${facture.id}`}
                      className="hover:underline"
                    >
                      {facture.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {facture.client?.prenom} {facture.client?.nom ?? ""}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {typeLabel(facture)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                    {formatXof(Number(facture.montantTotal))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={statusTone[facture.statut] ?? "neutral"}
                    >
                      {statusLabel[facture.statut] ?? facture.statut}
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
