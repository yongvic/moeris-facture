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

type SearchParams = Promise<{
  q?: string;
  statut?: string;
  type?: string;
}>;

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const statut = filters.statut?.trim() ?? "";
  const type = filters.type?.trim() ?? "";

  const factures = await prisma.facture.findMany({
    where: {
      ...(statut
        ? { statut: statut as "OUVERTE" | "PARTIELLEMENT_PAYEE" | "PAYEE" | "ANNULEE" }
        : {}),
      ...(type === "SEJOUR"
        ? { reservationId: { not: null } }
        : type === "EVENEMENT"
          ? { evenementId: { not: null } }
          : type === "SIMPLE"
            ? { reservationId: null, evenementId: null }
            : {}),
      ...(q
        ? {
            OR: [
              { numero: { contains: q, mode: "insensitive" } },
              { client: { prenom: { contains: q, mode: "insensitive" } } },
              { client: { nom: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
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
            Création rapide, paiements partiels et filtres métier exploitables.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/restaurant/pos"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Encaissement rapide
          </Link>
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

      <form className="grid gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-end">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Recherche
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="N° facture ou client"
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
            <option value="OUVERTE">Ouverte</option>
            <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
            <option value="PAYEE">Payée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Type
          <select
            name="type"
            defaultValue={type}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          >
            <option value="">Tous</option>
            <option value="SIMPLE">Simple</option>
            <option value="SEJOUR">Séjour</option>
            <option value="EVENEMENT">Événement</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
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
                    Aucune facture trouvée avec ces filtres.
                  </td>
                </tr>
              ) : (
                factures.map((facture) => (
                  <tr key={facture.id} className="border-t border-[color:var(--stroke)]">
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      <Link href={`/factures/${facture.id}`} className="hover:underline">
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
                      <StatusBadge tone={statusTone[facture.statut] ?? "neutral"}>
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
