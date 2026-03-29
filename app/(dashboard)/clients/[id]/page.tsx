import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { formatDate, formatXof } from "../../../../lib/format";
import ClientEditForm from "./ClientEditForm";
import StatusBadge from "../../components/StatusBadge";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      factures: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Client introuvable.
      </div>
    );
  }

  const total = client.factures.reduce(
    (acc, facture) => acc + Number(facture.montantTotal),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Profil client
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            {client.prenom} {client.nom ?? ""}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Créé le {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          <span>Total dépensé</span>
          <span className="text-xl font-semibold text-[color:var(--ink)]">
            {formatXof(total)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <h3 className="font-display text-xl text-[color:var(--ink)]">
            Informations client
          </h3>
          <div className="mt-4">
            <ClientEditForm client={client} />
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <h3 className="font-display text-xl text-[color:var(--ink)]">
            Factures associées
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {client.factures.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
                Aucune facture pour ce client.
              </div>
            ) : (
              client.factures.map((facture) => (
                <Link
                  key={facture.id}
                  href={`/factures/${facture.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {facture.numero}
                    </p>
                    <p className="text-xs text-[color:var(--ink-muted)]">
                      {formatDate(facture.createdAt)}
                    </p>
                  </div>
                  <StatusBadge tone={facture.statut === "PAYEE" ? "success" : "warning"}>
                    {facture.statut}
                  </StatusBadge>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
