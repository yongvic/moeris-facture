"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "../../../lib/auth-helpers";
import {
  reservationCreateSchema,
  reservationUpdateSchema,
} from "../../../lib/validators/reservation";
import {
  createReservationRecord,
  ReservationServiceError,
  transitionReservationStatus,
  updateReservationRecord,
} from "../../../lib/services/reservations";
import { zodErrorMessage } from "../../../lib/validation";
import { createAuditLog } from "../../../lib/audit";

type FormState = { error?: string; values?: Record<string, string> };

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

  const values = {
    clientId: formData.get("clientId")?.toString() ?? "",
    chambreId: formData.get("chambreId")?.toString() ?? "",
    dateArrivee: formData.get("dateArrivee")?.toString() ?? "",
    dateDepart: formData.get("dateDepart")?.toString() ?? "",
    nombreNuits: formData.get("nombreNuits")?.toString() ?? "",
    prixNegocie: formData.get("prixNegocie")?.toString() ?? "",
    nombreAdultes: formData.get("nombreAdultes")?.toString() ?? "1",
    nombreEnfants: formData.get("nombreEnfants")?.toString() ?? "0",
    notes: formData.get("notes")?.toString() ?? "",
  };

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
    return { error: zodErrorMessage(parsed.error), values };
  }

  let reservation;
  try {
    reservation = await createReservationRecord(parsed.data);
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message, values };
    }
    throw error;
  }

  revalidatePath("/reservations");
  revalidatePath("/factures");
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

  const values = {
    clientId: formData.get("clientId")?.toString() ?? "",
    chambreId: formData.get("chambreId")?.toString() ?? "",
    dateArrivee: formData.get("dateArrivee")?.toString() ?? "",
    dateDepart: formData.get("dateDepart")?.toString() ?? "",
    nombreNuits: formData.get("nombreNuits")?.toString() ?? "",
    prixNegocie: formData.get("prixNegocie")?.toString() ?? "",
    nombreAdultes: formData.get("nombreAdultes")?.toString() ?? "1",
    nombreEnfants: formData.get("nombreEnfants")?.toString() ?? "0",
    notes: formData.get("notes")?.toString() ?? "",
  };

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
    return { error: zodErrorMessage(parsed.error), values };
  }

  try {
    await updateReservationRecord(id, parsed.data);
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message, values };
    }
    throw error;
  }

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/factures");
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

  try {
    await transitionReservationStatus(id, "ANNULEE");
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_CANCELLED",
    entityType: "Reservation",
    entityId: id,
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  revalidatePath("/factures");
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

  try {
    await transitionReservationStatus(id, "CHECK_IN_EFFECTUE");
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_CHECK_IN",
    entityType: "Reservation",
    entityId: id,
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

  try {
    await transitionReservationStatus(id, "CHECK_OUT_EFFECTUE");
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_CHECK_OUT",
    entityType: "Reservation",
    entityId: id,
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  return {};
}

export async function changeReservationStatus(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get("id")?.toString();
  const statut = formData.get("statut")?.toString();
  if (!id || !statut) return { error: "Paramètres invalides." };

  const gate = await requireRole(statut === "ANNULEE" ? "MANAGER" : "STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  if (
    ![
      "CONFIRMEE",
      "CHECK_IN_EFFECTUE",
      "CHECK_OUT_EFFECTUE",
      "ANNULEE",
      "NO_SHOW",
    ].includes(statut)
  ) {
    return { error: "Statut invalide." };
  }

  try {
    await transitionReservationStatus(
      id,
      statut as
        | "CONFIRMEE"
        | "CHECK_IN_EFFECTUE"
        | "CHECK_OUT_EFFECTUE"
        | "ANNULEE"
        | "NO_SHOW"
    );
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "RESERVATION_STATUS_CHANGED",
    entityType: "Reservation",
    entityId: id,
    details: { statut },
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  revalidatePath("/chambres");
  revalidatePath("/factures");
  return {};
}
