"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import {
  reservationCreateSchema,
  reservationUpdateSchema,
} from "../../../lib/validators/reservation";
import {
  createReservationRecord,
  ReservationServiceError,
  updateReservationRecord,
} from "../../../lib/services/reservations";
import { zodErrorMessage } from "../../../lib/validation";
import { createAuditLog } from "../../../lib/audit";

type FormState = { error?: string };

const normalize = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

const toNumber = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

export async function createReservation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    clientId: normalize(formData.get("clientId")) ?? "",
    chambreId: normalize(formData.get("chambreId")) ?? "",
    dateArrivee: normalize(formData.get("dateArrivee")) ?? "",
    dateDepart: normalize(formData.get("dateDepart")) ?? "",
    nombreNuits: toNumber(formData.get("nombreNuits")) ?? undefined,
    prixNegocie: toNumber(formData.get("prixNegocie")),
    nombreAdultes: toNumber(formData.get("nombreAdultes")) ?? 1,
    nombreEnfants: toNumber(formData.get("nombreEnfants")) ?? 0,
    notes: normalize(formData.get("notes")),
  };

  const parsed = reservationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  let reservation;
  try {
    reservation = await createReservationRecord(parsed.data);
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/reservations");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_CREATED",
    entityType: "Reservation",
    entityId: reservation.id,
    details: {
      clientId: reservation.clientId,
      chambreId: reservation.chambreId,
    },
  });
  redirect(`/reservations/${reservation.id}`);
}

export async function updateReservation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Réservation introuvable." };

  const payload = {
    clientId: normalize(formData.get("clientId")) ?? "",
    chambreId: normalize(formData.get("chambreId")) ?? "",
    dateArrivee: normalize(formData.get("dateArrivee")) ?? "",
    dateDepart: normalize(formData.get("dateDepart")) ?? "",
    nombreNuits: toNumber(formData.get("nombreNuits")) ?? undefined,
    prixNegocie: toNumber(formData.get("prixNegocie")),
    nombreAdultes: toNumber(formData.get("nombreAdultes")) ?? 1,
    nombreEnfants: toNumber(formData.get("nombreEnfants")) ?? 0,
    notes: normalize(formData.get("notes")),
  };

  const parsed = reservationUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  try {
    await updateReservationRecord(id, parsed.data);
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_UPDATED",
    entityType: "Reservation",
    entityId: id,
    details: payload,
  });
  return {};
}

export async function cancelReservation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Réservation introuvable." };

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true, statut: true, chambreId: true },
  });
  if (!reservation) return { error: "Réservation introuvable." };
  if (reservation.statut === "CHECK_OUT_EFFECTUE") {
    return { error: "Impossible d'annuler un séjour déjà clôturé." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id },
      data: {
        statut: "ANNULEE",
        checkOutAt:
          reservation.statut === "CHECK_IN_EFFECTUE" ? new Date() : undefined,
      },
    });
    if (reservation.statut === "CHECK_IN_EFFECTUE") {
      await tx.chambre.update({
        where: { id: reservation.chambreId },
        data: { statut: "DISPONIBLE" },
      });
    }
    await createAuditLog(
      {
        actorId: gate.session.user?.id ?? null,
        action: "RESERVATION_CANCELLED",
        entityType: "Reservation",
        entityId: id,
      },
      tx
    );
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  return {};
}

export async function checkInReservation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Réservation introuvable." };

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      statut: true,
      chambreId: true,
      chambre: { select: { statut: true } },
    },
  });

  if (!reservation) return { error: "Réservation introuvable." };
  if (reservation.statut === "CHECK_OUT_EFFECTUE") {
    return { error: "Le séjour est déjà clôturé." };
  }
  if (reservation.statut === "CHECK_IN_EFFECTUE") {
    return { error: "Le check-in a déjà été effectué." };
  }
  if (reservation.statut === "ANNULEE" || reservation.statut === "NO_SHOW") {
    return { error: "Cette réservation ne peut pas passer en check-in." };
  }
  if (reservation.chambre.statut !== "DISPONIBLE") {
    return { error: "La chambre n'est pas disponible pour un check-in." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id },
      data: {
        statut: "CHECK_IN_EFFECTUE",
        checkInAt: new Date(),
      },
    });
    await tx.chambre.update({
      where: { id: reservation.chambreId },
      data: { statut: "OCCUPEE" },
    });
    await createAuditLog(
      {
        actorId: gate.session.user?.id ?? null,
        action: "RESERVATION_CHECK_IN",
        entityType: "Reservation",
        entityId: id,
      },
      tx
    );
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  return {};
}

export async function checkOutReservation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Réservation introuvable." };

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true, statut: true, chambreId: true },
  });

  if (!reservation) return { error: "Réservation introuvable." };
  if (reservation.statut !== "CHECK_IN_EFFECTUE") {
    return { error: "Le check-out nécessite un check-in préalable." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id },
      data: {
        statut: "CHECK_OUT_EFFECTUE",
        checkOutAt: new Date(),
      },
    });
    await tx.chambre.update({
      where: { id: reservation.chambreId },
      data: { statut: "DISPONIBLE" },
    });
    await createAuditLog(
      {
        actorId: gate.session.user?.id ?? null,
        action: "RESERVATION_CHECK_OUT",
        entityType: "Reservation",
        entityId: id,
      },
      tx
    );
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  return {};
}
