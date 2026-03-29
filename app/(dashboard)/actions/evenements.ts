"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { evenementCreateSchema, evenementUpdateSchema } from "../../../lib/validators/evenement";
import { z } from "zod";
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

export async function createEvenement(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    titre: normalize(formData.get("titre")) ?? "",
    type: normalize(formData.get("type")) ?? "SOIREE",
    description: normalize(formData.get("description")),
    dateDebut: normalize(formData.get("dateDebut")) ?? "",
    dateFin: normalize(formData.get("dateFin")) ?? "",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    prixParParticipant: toNumber(formData.get("prixParParticipant")),
    prixForfait: toNumber(formData.get("prixForfait")),
    acompteRequis: toNumber(formData.get("acompteRequis")),
    statut: normalize(formData.get("statut")) ?? "A_VENIR",
  };

  const parsed = evenementCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const dateDebut = new Date(parsed.data.dateDebut);
  const dateFin = new Date(parsed.data.dateFin);
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
    return { error: "Dates invalides." };
  }
  if (dateFin < dateDebut) {
    return { error: "La date de fin doit être après la date de début." };
  }

  const evenement = await prisma.evenement.create({
    data: {
      ...parsed.data,
      dateDebut,
      dateFin,
    },
  });

  revalidatePath("/evenements");
  redirect(`/evenements/${evenement.id}`);
}

export async function updateEvenement(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Événement introuvable." };

  const payload = {
    titre: normalize(formData.get("titre")) ?? "",
    type: normalize(formData.get("type")) ?? "SOIREE",
    description: normalize(formData.get("description")),
    dateDebut: normalize(formData.get("dateDebut")) ?? "",
    dateFin: normalize(formData.get("dateFin")) ?? "",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    prixParParticipant: toNumber(formData.get("prixParParticipant")),
    prixForfait: toNumber(formData.get("prixForfait")),
    acompteRequis: toNumber(formData.get("acompteRequis")),
    statut: normalize(formData.get("statut")) ?? undefined,
  };

  const parsed = evenementUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  if (parsed.data.dateDebut || parsed.data.dateFin) {
    const dateDebut = parsed.data.dateDebut
      ? new Date(parsed.data.dateDebut)
      : undefined;
    const dateFin = parsed.data.dateFin ? new Date(parsed.data.dateFin) : undefined;
    if (
      (dateDebut && Number.isNaN(dateDebut.getTime())) ||
      (dateFin && Number.isNaN(dateFin.getTime()))
    ) {
      return { error: "Dates invalides." };
    }
    if (dateDebut && dateFin && dateFin < dateDebut) {
      return { error: "La date de fin doit être après la date de début." };
    }
  }

  await prisma.evenement.update({
    where: { id },
    data: {
      ...parsed.data,
      dateDebut: parsed.data.dateDebut
        ? new Date(parsed.data.dateDebut)
        : undefined,
      dateFin: parsed.data.dateFin ? new Date(parsed.data.dateFin) : undefined,
    },
  });

  revalidatePath(`/evenements/${id}`);
  revalidatePath("/evenements");
  return {};
}

const participantSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  contact: z.string().optional().nullable(),
});

export async function addParticipant(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const evenementId = formData.get("evenementId")?.toString();
  if (!evenementId) return { error: "Événement introuvable." };

  const payload = {
    nom: normalize(formData.get("nom")) ?? "",
    prenom: normalize(formData.get("prenom")) ?? "",
    contact: normalize(formData.get("contact")),
  };

  const parsed = participantSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error, "Participant invalide.") };
  }

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    select: { capaciteMax: true, _count: { select: { participants: true } } },
  });

  if (!evenement) return { error: "Événement introuvable." };
  if (
    evenement.capaciteMax &&
    evenement._count.participants >= evenement.capaciteMax
  ) {
    return { error: "Capacité maximale atteinte." };
  }

  await prisma.participantEvenement.create({
    data: {
      evenementId,
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      contact: parsed.data.contact ?? null,
      statut: "INSCRIT",
    },
  });

  revalidatePath(`/evenements/${evenementId}`);
  return {};
}
