"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import {
  reservationCreateSchema,
  reservationUpdateSchema,
} from "../../../lib/validators/reservation";
import { zodErrorMessage } from "../../../lib/validation";

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
    statut: normalize(formData.get("statut")) ?? undefined,
    notes: normalize(formData.get("notes")),
  };

  const parsed = reservationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const dateArrivee = new Date(parsed.data.dateArrivee);
  const dateDepart = new Date(parsed.data.dateDepart);

  if (Number.isNaN(dateArrivee.getTime()) || Number.isNaN(dateDepart.getTime())) {
    return { error: "Dates invalides." };
  }

  if (dateDepart <= dateArrivee) {
    return { error: "La date de départ doit être après la date d'arrivée." };
  }
  const nombreNuits =
    parsed.data.nombreNuits ??
    Math.max(1, Math.ceil((dateDepart.getTime() - dateArrivee.getTime()) / 86400000));

  const chambre = await prisma.chambre.findUnique({
    where: { id: parsed.data.chambreId },
    select: { capacite: true },
  });
  if (!chambre) return { error: "Chambre introuvable." };

  const totalVoyageurs =
    (parsed.data.nombreAdultes ?? 1) + (parsed.data.nombreEnfants ?? 0);
  if (totalVoyageurs > chambre.capacite) {
    return { error: "Capacité de la chambre dépassée." };
  }

  const overlap = await prisma.reservation.findFirst({
    where: {
      chambreId: parsed.data.chambreId,
      statut: { not: "ANNULEE" },
      OR: [
        {
          dateArrivee: { lte: dateDepart },
          dateDepart: { gte: dateArrivee },
        },
      ],
    },
  });

  if (overlap) {
    return { error: "Conflit de réservation détecté." };
  }

  const reservation = await prisma.reservation.create({
    data: {
      clientId: parsed.data.clientId,
      chambreId: parsed.data.chambreId,
      dateArrivee,
      dateDepart,
      nombreNuits,
      prixNegocie: parsed.data.prixNegocie ?? null,
      nombreAdultes: parsed.data.nombreAdultes ?? 1,
      nombreEnfants: parsed.data.nombreEnfants ?? 0,
      statut: parsed.data.statut ?? "CONFIRMEE",
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/reservations");
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
    statut: normalize(formData.get("statut")) ?? undefined,
    notes: normalize(formData.get("notes")),
  };

  const parsed = reservationUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const current = await prisma.reservation.findUnique({
    where: { id },
    include: { chambre: true },
  });
  if (!current) return { error: "Réservation introuvable." };

  if (parsed.data.dateArrivee || parsed.data.dateDepart) {
    const arrivee = parsed.data.dateArrivee
      ? new Date(parsed.data.dateArrivee)
      : current.dateArrivee;
    const depart = parsed.data.dateDepart
      ? new Date(parsed.data.dateDepart)
      : current.dateDepart;

    if (Number.isNaN(arrivee.getTime()) || Number.isNaN(depart.getTime())) {
      return { error: "Dates invalides." };
    }

    if (depart <= arrivee) {
      return { error: "La date de départ doit être après la date d'arrivée." };
    }
  }

  const chambreId = parsed.data.chambreId ?? current.chambreId;
  const chambre =
    chambreId === current.chambreId
      ? current.chambre
      : await prisma.chambre.findUnique({
          where: { id: chambreId },
          select: { capacite: true },
        });

  if (!chambre) return { error: "Chambre introuvable." };

  const totalVoyageurs =
    (parsed.data.nombreAdultes ?? current.nombreAdultes) +
    (parsed.data.nombreEnfants ?? current.nombreEnfants);

  if (totalVoyageurs > chambre.capacite) {
    return { error: "Capacité de la chambre dépassée." };
  }

  await prisma.reservation.update({
    where: { id },
    data: {
      ...parsed.data,
      dateArrivee: parsed.data.dateArrivee
        ? new Date(parsed.data.dateArrivee)
        : undefined,
      dateDepart: parsed.data.dateDepart
        ? new Date(parsed.data.dateDepart)
        : undefined,
    },
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
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

  await prisma.reservation.update({
    where: { id },
    data: { statut: "ANNULEE" },
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
  return {};
}
