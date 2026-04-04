import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import CsvImportForm from "../../components/CsvImportForm";
import { prisma } from "../../../lib/prisma";
import { formatDate, formatXof } from "../../../lib/format";
import { importClientsCsv } from "../actions/clients";

type SearchParams = Promise<{
  q?: string;
  segment?: string;
}>;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const segment = filters.segment?.trim() ?? "";

  const clients = await prisma.client.findMany({
    where: {
      actif: true,
      ...(segment
        ? { segment: segment as "STANDARD" | "FREQUENT" | "VIP" | "PREMIUM" }
        : {}),
      ...(q
        ? {
            OR: [
              { prenom: { contains: q, mode: "insensitive" } },
              { nom: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { telephone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      factures: {
        select: {
          montantTotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            CRM
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Clients & segmentation
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Recherche réelle, historique de dépenses et import opérationnel.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/api/exports/clients"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Export CSV
          </Link>
          <Link
            href="/clients/nouveau"
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
          >
            Nouveau client
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <form className="grid gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Recherche
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nom, email, téléphone"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Segment
            <select
              name="segment"
              defaultValue={segment}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            >
              <option value="">Tous</option>
              <option value="STANDARD">Standard</option>
              <option value="FREQUENT">Fréquent</option>
              <option value="VIP">VIP</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            Filtrer
          </button>
        </form>

        <CsvImportForm
          action={importClientsCsv}
          title="Import clients"
          hint="Colonnes supportées: prenom, nom, email, telephone, segment, nationalite, numeroPiece, adresse, notes."
        />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Visites</th>
                <th className="px-4 py-3 font-medium">Dernière visite</th>
                <th className="px-4 py-3 font-medium">Dépenses totales</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                  >
                    Aucun client trouvé avec ces filtres.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const total = client.factures.reduce(
                    (acc, facture) => acc + Number(facture.montantTotal ?? 0),
                    0
                  );
                  const lastVisit =
                    client.factures.length > 0
                      ? client.factures[0].createdAt
                      : client.createdAt;

                  return (
                    <tr key={client.id} className="border-t border-[color:var(--stroke)]">
                      <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                        <Link href={`/clients/${client.id}`} className="hover:underline">
                          {client.prenom} {client.nom ?? ""}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          tone={
                            client.segment === "VIP"
                              ? "success"
                              : client.segment === "FREQUENT"
                                ? "info"
                                : "neutral"
                          }
                        >
                          {client.segment}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                        {client.factures.length}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                        {formatDate(lastVisit)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                        {formatXof(total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
