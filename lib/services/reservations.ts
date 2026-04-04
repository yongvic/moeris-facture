import { prisma } from "../prisma";

type PrismaClientLike = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type ReservationPayload = {
  clientId: string;
  chambreId: string;
  dateArrivee: string;
  dateDepart: string;
  nombreNuits?: number;
  prixNegocie?: number | null;
  nombreAdultes?: number;
  nombreEnfants?: number;
  statut?:
    | "CONFIRMEE"
    | "CHECK_IN_EFFECTUE"
    | "CHECK_OUT_EFFECTUE"
    | "ANNULEE"
    | "NO_SHOW";
  notes?: string | null;
};

export class ReservationServiceError extends Error {}

function ensureValidDates(dateArrivee: string, dateDepart: string) {
  const arrivee = new Date(dateArrivee);
  const depart = new Date(dateDepart);

  if (Number.isNaN(arrivee.getTime()) || Number.isNaN(depart.getTime())) {
    throw new ReservationServiceError("Dates invalides.");
  }

  if (depart <= arrivee) {
    throw new ReservationServiceError(
      "La date de départ doit être après la date d'arrivée."
    );
  }

  return { arrivee, depart };
}

async function assertReservationConstraints(
  client: PrismaClientLike,
  payload: ReservationPayload,
  options?: { excludeReservationId?: string }
) {
  const { arrivee, depart } = ensureValidDates(payload.dateArrivee, payload.dateDepart);
  const chambre = await client.chambre.findUnique({
    where: { id: payload.chambreId },
    select: { capacite: true },
  });

  if (!chambre) {
    throw new ReservationServiceError("Chambre introuvable.");
  }

  const totalVoyageurs = (payload.nombreAdultes ?? 1) + (payload.nombreEnfants ?? 0);
  if (totalVoyageurs > chambre.capacite) {
    throw new ReservationServiceError("Capacité de la chambre dépassée.");
  }

  const overlap = await client.reservation.findFirst({
    where: {
      chambreId: payload.chambreId,
      id: options?.excludeReservationId
        ? { not: options.excludeReservationId }
        : undefined,
      statut: { notIn: ["ANNULEE", "CHECK_OUT_EFFECTUE"] },
      dateArrivee: { lt: depart },
      dateDepart: { gt: arrivee },
    },
    select: { id: true },
  });

  if (overlap) {
    throw new ReservationServiceError("Conflit de réservation détecté.");
  }

  return {
    dateArrivee: arrivee,
    dateDepart: depart,
    nombreNuits:
      payload.nombreNuits ??
      Math.max(1, Math.ceil((depart.getTime() - arrivee.getTime()) / 86400000)),
  };
}

export async function createReservationRecord(
  payload: ReservationPayload,
  client: PrismaClientLike = prisma
) {
  const normalized = await assertReservationConstraints(client, payload);

  return client.reservation.create({
    data: {
      clientId: payload.clientId,
      chambreId: payload.chambreId,
      dateArrivee: normalized.dateArrivee,
      dateDepart: normalized.dateDepart,
      nombreNuits: normalized.nombreNuits,
      prixNegocie: payload.prixNegocie ?? null,
      nombreAdultes: payload.nombreAdultes ?? 1,
      nombreEnfants: payload.nombreEnfants ?? 0,
      statut: payload.statut ?? "CONFIRMEE",
      notes: payload.notes ?? null,
    },
  });
}

export async function updateReservationRecord(
  reservationId: string,
  payload: Partial<ReservationPayload>,
  client: PrismaClientLike = prisma
) {
  const current = await client.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!current) {
    throw new ReservationServiceError("Réservation introuvable.");
  }

  const mergedPayload: ReservationPayload = {
    clientId: payload.clientId ?? current.clientId,
    chambreId: payload.chambreId ?? current.chambreId,
    dateArrivee: payload.dateArrivee ?? current.dateArrivee.toISOString(),
    dateDepart: payload.dateDepart ?? current.dateDepart.toISOString(),
    nombreNuits: payload.nombreNuits ?? current.nombreNuits,
    prixNegocie:
      payload.prixNegocie !== undefined
        ? payload.prixNegocie
        : current.prixNegocie !== null
        ? Number(current.prixNegocie)
        : null,
    nombreAdultes: payload.nombreAdultes ?? current.nombreAdultes,
    nombreEnfants: payload.nombreEnfants ?? current.nombreEnfants,
    statut: payload.statut ?? current.statut,
    notes: payload.notes !== undefined ? payload.notes : current.notes,
  };

  const normalized = await assertReservationConstraints(client, mergedPayload, {
    excludeReservationId: reservationId,
  });

  return client.reservation.update({
    where: { id: reservationId },
    data: {
      ...payload,
      dateArrivee: normalized.dateArrivee,
      dateDepart: normalized.dateDepart,
      nombreNuits: normalized.nombreNuits,
    },
  });
}
