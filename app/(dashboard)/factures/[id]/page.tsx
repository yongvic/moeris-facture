import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { formatDate, formatXof } from "../../../../lib/format";
import StatusBadge from "../../components/StatusBadge";
import { addConsommation, addPaiement, updateFactureStatus } from "../../actions/factures";

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
  params: { id: string };
}) {
  const facture = await prisma.facture.findUnique({
    where: { id: params.id },
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
            <form action={addConsommation} className="mt-4 grid gap-4">
              <input type="hidden" name="factureId" value={facture.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  Catégorie
                  <select
                    name="categorie"
                    defaultValue="DIVERS"
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                  >
                    <option value="CHAMBRE">CHAMBRE</option>
                    <option value="RESTAURANT">RESTAURANT</option>
                    <option value="ACTIVITE">ACTIVITE</option>
                    <option value="EVENEMENT">EVENEMENT</option>
                    <option value="DIVERS">DIVERS</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  Description
                  <input
                    name="description"
                    required
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  Quantité
                  <input
                    name="quantite"
                    type="number"
                    step="0.1"
                    defaultValue={1}
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  Prix unitaire
                  <input
                    name="prixUnitaire"
                    type="number"
                    step="0.01"
                    required
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  Remise
                  <input
                    name="remise"
                    type="number"
                    step="0.01"
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </label>
              </div>
              <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">
                Ajouter la consommation
              </button>
            </form>
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
            <form action={addPaiement} className="mt-4 grid gap-4">
              <input type="hidden" name="factureId" value={facture.id} />
              <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                Montant
                <input
                  name="montant"
                  type="number"
                  step="0.01"
                  required
                  className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                Mode de paiement
                <select
                  name="modePaiement"
                  defaultValue="ESPECES"
                  className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                >
                  <option value="ESPECES">ESPECES</option>
                  <option value="VIREMENT">VIREMENT</option>
                  <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                  <option value="CARTE_BANCAIRE">CARTE_BANCAIRE</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="AUTRE">AUTRE</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                Référence
                <input
                  name="reference"
                  className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
                />
              </label>
              <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">
                Enregistrer le paiement
              </button>
            </form>
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

            <form action={updateFactureStatus} className="mt-6 grid gap-3">
              <input type="hidden" name="id" value={facture.id} />
              <button
                name="statut"
                value="PAYEE"
                className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
              >
                Marquer comme payée
              </button>
              <button
                name="statut"
                value="ANNULEE"
                className="rounded-full border border-[color:var(--danger)]/40 px-4 py-2 text-sm font-semibold text-[color:var(--danger)]"
              >
                Annuler la facture
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
