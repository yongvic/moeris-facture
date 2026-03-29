"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { chambreCreateSchema, chambreUpdateSchema } from "../../../lib/validators/chambre";
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

const toArray = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export async function createChambre(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    numero: normalize(formData.get("numero")) ?? "",
    nom: normalize(formData.get("nom")),
    type: normalize(formData.get("type")) ?? "STANDARD",
    capacite: toNumber(formData.get("capacite")) ?? 1,
    prixNuit: toNumber(formData.get("prixNuit")) ?? 0,
    description: normalize(formData.get("description")),
    equipements: toArray(formData.get("equipements")),
    statut: normalize(formData.get("statut")) ?? undefined,
    etage: toNumber(formData.get("etage")),
  };

  const parsed = chambreCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const chambre = await prisma.chambre.create({
    data: parsed.data,
  });

  revalidatePath("/chambres");
  redirect(`/chambres/${chambre.id}`);
}

export async function updateChambre(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Chambre introuvable." };

  const payload = {
    numero: normalize(formData.get("numero")) ?? "",
    nom: normalize(formData.get("nom")),
    type: normalize(formData.get("type")) ?? "STANDARD",
    capacite: toNumber(formData.get("capacite")) ?? 1,
    prixNuit: toNumber(formData.get("prixNuit")) ?? 0,
    description: normalize(formData.get("description")),
    equipements: toArray(formData.get("equipements")),
    statut: normalize(formData.get("statut")) ?? undefined,
    etage: toNumber(formData.get("etage")),
  };

  const parsed = chambreUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  await prisma.chambre.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/chambres/${id}`);
  revalidatePath("/chambres");
  return {};
}
