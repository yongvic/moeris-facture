import ReservationForm from "./ReservationForm";
import { prisma } from "../../../../lib/prisma";

export default async function NouvelleReservationPage() {
  const [clients, chambres] = await Promise.all([
    prisma.client.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.chambre.findMany({
      orderBy: { numero: "asc" },
      take: 50,
    }),
  ]);

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.prenom} ${client.nom ?? ""}`.trim(),
  }));

  const roomOptions = chambres.map((chambre) => ({
    id: chambre.id,
    label: chambre.nom ?? chambre.numero,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Réservations
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Nouvelle réservation
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Associez un client et une chambre.
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ReservationForm clients={clientOptions} chambres={roomOptions} />
        {clientOptions.length === 0 || roomOptions.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--ink-muted)]">
            Crée d&apos;abord des clients et des chambres pour enregistrer une
            réservation.
          </p>
        ) : null}
      </div>
    </div>
  );
}
