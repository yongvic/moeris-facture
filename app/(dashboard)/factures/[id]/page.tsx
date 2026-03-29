import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { formatDate, formatXof } from "../../../../lib/format";
import StatusBadge from "../../../components/StatusBadge";
import ConsommationForm from "./ConsommationForm";
import PaiementForm from "./PaiementForm";
import StatusUpdateForm from "./StatusUpdateForm";

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

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const facture = await prisma.facture.findUnique({
    where: { id },
    include: {
      client: true,
      consommations: { orderBy: { createdAt: "desc" } },
      paiements: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!facture) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Facture introuvable.
      </div>
    );
  }

  const total = Number(facture.montantTotal);
  const paid = Number(facture.montantPaye);
  const remaining = Math.max(0, total - paid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Facture
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            {facture.numero}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Client : {facture.client?.prenom} {facture.client?.nom ?? ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          <StatusBadge tone={statusTone[facture.statut] ?? "neutral"}>
            {statusLabel[facture.statut] ?? facture.statut}
          </StatusBadge>
          <Link
            href={`/api/factures/${facture.id}/pdf`}
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Télécharger PDF
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Consommations
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {facture.consommations.length === 0 ? (
                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
                  Aucune consommation ajoutée.
                </div>
              ) : (
                facture.consommations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[color:var(--ink)]">
                        {item.description}
                      </p>
                      <p className="text-xs text-[color:var(--ink-muted)]">
                        {item.categorie} • Qté {Number(item.quantite)}
                      </p>
                    </div>
                    <span className="font-semibold text-[color:var(--ink)]">
                      {formatXof(Number(item.sousTotal))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Ajouter une consommation
            </h3>
            <ConsommationForm factureId={facture.id} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Paiements
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {facture.paiements.length === 0 ? (
                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
                  Aucun paiement enregistré.
                </div>
              ) : (
                facture.paiements.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[color:var(--ink)]">
                        {payment.modePaiement}
                      </p>
                      <p className="text-xs text-[color:var(--ink-muted)]">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold text-[color:var(--ink)]">
                      {formatXof(Number(payment.montant))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Ajouter un paiement
            </h3>
            <PaiementForm factureId={facture.id} />
          </div>

          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Récapitulatif
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {formatXof(total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payé</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {formatXof(paid)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reste à payer</span>
                <span className="font-semibold text-[color:var(--ink)]">
                  {formatXof(remaining)}
                </span>
              </div>
            </div>

            <StatusUpdateForm factureId={facture.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
