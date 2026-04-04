import { prisma } from "../prisma";
import { generateFactureNumero } from "../invoice";
import { recalcFacture } from "../billing";

type PrismaClientLike = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
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
    select: { capacite: true, statut: true },
  });

  if (!chambre) {
    throw new ReservationServiceError("Chambre introuvable.");
  }

  if (["MAINTENANCE", "HORS_SERVICE"].includes(chambre.statut)) {
    throw new ReservationServiceError(
      "Cette chambre n'est pas réservable dans son état actuel."
    );
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
      statut: { notIn: ["ANNULEE", "CHECK_OUT_EFFECTUE", "NO_SHOW"] },
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

export async function syncChambreStatut(
  chambreId: string,
  client: PrismaClientLike = prisma
) {
  const chambre = await client.chambre.findUnique({
    where: { id: chambreId },
    select: { id: true, statut: true },
  });

  if (!chambre) {
    throw new ReservationServiceError("Chambre introuvable.");
  }

  if (["MAINTENANCE", "HORS_SERVICE"].includes(chambre.statut)) {
    return chambre.statut;
  }

  const activeReservations = await client.reservation.findMany({
    where: {
      chambreId,
      statut: { in: ["CONFIRMEE", "CHECK_IN_EFFECTUE"] },
    },
    select: { statut: true },
  });

  const nextStatut = activeReservations.some(
    (reservation) => reservation.statut === "CHECK_IN_EFFECTUE"
  )
    ? "OCCUPEE"
    : activeReservations.some((reservation) => reservation.statut === "CONFIRMEE")
      ? "RESERVEE"
      : "DISPONIBLE";

  if (chambre.statut !== nextStatut) {
    await client.chambre.update({
      where: { id: chambreId },
      data: { statut: nextStatut },
    });
  }

  return nextStatut;
}

async function syncReservationFacture(
  reservationId: string,
  client: PrismaClientLike,
  options?: { disableStayLine?: boolean }
) {
  const reservation = await client.reservation.findUnique({
    where: { id: reservationId },
    include: {
      chambre: {
        select: {
          numero: true,
          nom: true,
          prixNuit: true,
        },
      },
      factures: {
        where: { statut: { not: "ANNULEE" } },
        include: {
          consommations: {
            where: { supprimee: false, categorie: "CHAMBRE" },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!reservation) {
    throw new ReservationServiceError("Réservation introuvable.");
  }

  const primaryFacture =
    reservation.factures[0] ??
    (await client.facture.create({
      data: {
        numero: await generateFactureNumero(client),
        clientId: reservation.clientId,
        reservationId: reservation.id,
        notes: `Séjour lié à la réservation ${reservation.id}`,
      },
      include: {
        consommations: {
          where: { supprimee: false, categorie: "CHAMBRE" },
          orderBy: { createdAt: "asc" },
        },
      },
    }));

  const prixNuit = reservation.prixNegocie
    ? Number(reservation.prixNegocie)
    : Number(reservation.chambre.prixNuit);
  const description = `Séjour ${reservation.chambre.nom ?? reservation.chambre.numero} (${reservation.nombreNuits} nuit(s))`;
  const existingStayLine = primaryFacture.consommations[0];

  if (primaryFacture.clientId !== reservation.clientId) {
    await client.facture.update({
      where: { id: primaryFacture.id },
      data: { clientId: reservation.clientId },
    });
  }

  if (options?.disableStayLine) {
    if (existingStayLine) {
      await client.consommation.update({
        where: { id: existingStayLine.id },
        data: {
          supprimee: true,
          supprimeeAt: new Date(),
        },
      });
      await recalcFacture(primaryFacture.id, client);
    }

    const activeLines = await client.consommation.count({
      where: { factureId: primaryFacture.id, supprimee: false },
    });
    const factureFresh = await client.facture.findUnique({
      where: { id: primaryFacture.id },
      select: { montantPaye: true, statut: true },
    });

    if (
      activeLines === 0 &&
      factureFresh &&
      Number(factureFresh.montantPaye) === 0 &&
      factureFresh.statut !== "ANNULEE"
    ) {
      await client.facture.update({
        where: { id: primaryFacture.id },
        data: {
          statut: "ANNULEE",
          clotureeAt: null,
        },
      });
    }
    return primaryFacture.id;
  }

  if (existingStayLine) {
    await client.consommation.update({
      where: { id: existingStayLine.id },
      data: {
        description,
        quantite: reservation.nombreNuits,
        prixUnitaire: prixNuit,
        sousTotal: reservation.nombreNuits * prixNuit,
        supprimee: false,
        supprimeeAt: null,
      },
    });
  } else {
    await client.consommation.create({
      data: {
        factureId: primaryFacture.id,
        categorie: "CHAMBRE",
        description,
        quantite: reservation.nombreNuits,
        prixUnitaire: prixNuit,
        sousTotal: reservation.nombreNuits * prixNuit,
      },
    });
  }

  await recalcFacture(primaryFacture.id, client);
  return primaryFacture.id;
}

export async function createReservationRecord(
  payload: ReservationPayload,
  client: PrismaClientLike = prisma
) {
  return client.$transaction(async (tx) => {
    const normalized = await assertReservationConstraints(tx, payload);

    const reservation = await tx.reservation.create({
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

    if (reservation.statut !== "ANNULEE" && reservation.statut !== "NO_SHOW") {
      await syncReservationFacture(reservation.id, tx);
    }
    await syncChambreStatut(reservation.chambreId, tx);

    return reservation;
  });
}

export async function updateReservationRecord(
  reservationId: string,
  payload: Partial<ReservationPayload>,
  client: PrismaClientLike = prisma
) {
  return client.$transaction(async (tx) => {
    const current = await tx.reservation.findUnique({
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

    const normalized = await assertReservationConstraints(tx, mergedPayload, {
      excludeReservationId: reservationId,
    });

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        ...payload,
        dateArrivee: normalized.dateArrivee,
        dateDepart: normalized.dateDepart,
        nombreNuits: normalized.nombreNuits,
      },
    });

    if (updated.statut === "ANNULEE" || updated.statut === "NO_SHOW") {
      await syncReservationFacture(updated.id, tx, { disableStayLine: true });
    } else {
      await syncReservationFacture(updated.id, tx);
    }

    if (current.chambreId !== updated.chambreId) {
      await syncChambreStatut(current.chambreId, tx);
    }
    await syncChambreStatut(updated.chambreId, tx);

    return updated;
  });
}

export async function transitionReservationStatus(
  reservationId: string,
  targetStatut:
    | "CONFIRMEE"
    | "CHECK_IN_EFFECTUE"
    | "CHECK_OUT_EFFECTUE"
    | "ANNULEE"
    | "NO_SHOW",
  client: PrismaClientLike = prisma
) {
  return client.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { chambre: { select: { statut: true } } },
    });

    if (!reservation) {
      throw new ReservationServiceError("Réservation introuvable.");
    }

    if (reservation.statut === targetStatut) {
      return reservation;
    }

    if (reservation.statut === "CHECK_OUT_EFFECTUE") {
      throw new ReservationServiceError("Le séjour est déjà clôturé.");
    }

    if (targetStatut === "CHECK_IN_EFFECTUE") {
      if (reservation.statut !== "CONFIRMEE") {
        throw new ReservationServiceError("Le check-in nécessite une réservation confirmée.");
      }
      if (!["DISPONIBLE", "RESERVEE"].includes(reservation.chambre.statut)) {
        throw new ReservationServiceError("La chambre n'est pas disponible pour un check-in.");
      }
    }

    if (targetStatut === "CHECK_OUT_EFFECTUE" && reservation.statut !== "CHECK_IN_EFFECTUE") {
      throw new ReservationServiceError("Le check-out nécessite un check-in préalable.");
    }

    if (targetStatut === "NO_SHOW" && reservation.statut === "CHECK_IN_EFFECTUE") {
      throw new ReservationServiceError("Impossible de marquer no-show après le check-in.");
    }

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        statut: targetStatut,
        checkInAt:
          targetStatut === "CHECK_IN_EFFECTUE"
            ? reservation.checkInAt ?? new Date()
            : targetStatut === "CONFIRMEE"
              ? null
              : undefined,
        checkOutAt:
          targetStatut === "CHECK_OUT_EFFECTUE" ||
          (targetStatut === "ANNULEE" && reservation.statut === "CHECK_IN_EFFECTUE")
            ? new Date()
            : targetStatut === "CONFIRMEE"
              ? null
              : undefined,
      },
    });

    if (targetStatut === "ANNULEE" || targetStatut === "NO_SHOW") {
      await syncReservationFacture(updated.id, tx, { disableStayLine: true });
    } else {
      await syncReservationFacture(updated.id, tx);
    }

    await syncChambreStatut(updated.chambreId, tx);
    return updated;
  });
}
