import { prisma } from "../../../../lib/prisma";
import ReservationEditForm from "./ReservationEditForm";

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { client: true, chambre: true },
  });

  if (!reservation) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Réservation introuvable.
      </div>
    );
  }

  const [clients, chambres] = await Promise.all([
    prisma.client.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.chambre.findMany({ orderBy: { numero: "asc" }, take: 50 }),
  ]);

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.prenom} ${client.nom ?? ""}`.trim(),
  }));

  const roomOptions = chambres.map((chambre) => ({
    id: chambre.id,
    label: chambre.nom ?? chambre.numero,
  }));

  const reservationData = {
    ...reservation,
    prixNegocie: reservation.prixNegocie
      ? Number(reservation.prixNegocie)
      : null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Réservation
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          {reservation.client?.prenom} {reservation.client?.nom ?? ""}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          {reservation.chambre?.nom ?? reservation.chambre?.numero} •{" "}
          {new Date(reservation.dateArrivee).toLocaleDateString("fr-FR")} →{" "}
          {new Date(reservation.dateDepart).toLocaleDateString("fr-FR")}
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ReservationEditForm
          reservation={reservationData}
          clients={clientOptions}
          chambres={roomOptions}
        />
      </div>
    </div>
  );
}
