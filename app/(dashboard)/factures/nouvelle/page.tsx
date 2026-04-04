import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import FactureForm from "./FactureForm";

export default async function NouvelleFacturePage() {
  const [clients, reservations, evenements] = await Promise.all([
    prisma.client.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.reservation.findMany({
      where: {
        statut: { in: ["CONFIRMEE", "CHECK_IN_EFFECTUE"] },
        factures: { none: { statut: { not: "ANNULEE" } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { client: true, chambre: true },
    }),
    prisma.evenement.findMany({
      where: { statut: { not: "ANNULE" } },
      orderBy: { dateDebut: "desc" },
      take: 50,
    }),
  ]);

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.prenom} ${client.nom ?? ""}`.trim(),
  }));
  const reservationOptions = reservations.map((reservation) => ({
    id: reservation.id,
    clientId: reservation.clientId,
    label: `${reservation.client.prenom} ${reservation.client.nom ?? ""} • ${reservation.chambre.nom ?? reservation.chambre.numero}`,
  }));
  const evenementOptions = evenements.map((evenement) => ({
    id: evenement.id,
    label: `${evenement.titre} • ${new Date(evenement.dateDebut).toLocaleDateString("fr-FR")}`,
    prixForfait: evenement.prixForfait ? Number(evenement.prixForfait) : null,
    prixParParticipant: evenement.prixParParticipant
      ? Number(evenement.prixParParticipant)
      : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Facturation
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Nouvelle facture
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Crée une facture simple, une facture de séjour ou une facture événement.
        </p>
      </div>

      <FactureForm
        clients={clientOptions}
        reservations={reservationOptions}
        evenements={evenementOptions}
      />
      {clients.length === 0 ? (
        <div className="mt-4">
          <Link
            href="/clients/nouveau"
            className="text-sm font-semibold text-[color:var(--accent)]"
          >
            Créer un client
          </Link>
        </div>
      ) : null}
    </div>
  );
}
