"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { activiteCreateSchema, activiteUpdateSchema } from "../../../lib/validators/activite";
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

export async function createActivite(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    nom: normalize(formData.get("nom")) ?? "",
    description: normalize(formData.get("description")),
    prix: toNumber(formData.get("prix")) ?? 0,
    prixParUnite: normalize(formData.get("prixParUnite")) ?? "personne",
    gratuit: formData.get("gratuit") === "on",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    disponible: formData.get("disponible") !== "off",
  };

  if (payload.gratuit) {
    payload.prix = 0;
  }

  const parsed = activiteCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const activite = await prisma.activite.create({
    data: parsed.data,
  });

  revalidatePath("/activites");
  redirect(`/activites/${activite.id}`);
}

export async function updateActivite(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Activité introuvable." };

  const payload = {
    nom: normalize(formData.get("nom")) ?? "",
    description: normalize(formData.get("description")),
    prix: toNumber(formData.get("prix")) ?? 0,
    prixParUnite: normalize(formData.get("prixParUnite")) ?? "personne",
    gratuit: formData.get("gratuit") === "on",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    disponible: formData.get("disponible") !== "off",
  };

  if (payload.gratuit) {
    payload.prix = 0;
  }

  const parsed = activiteUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  await prisma.activite.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/activites/${id}`);
  revalidatePath("/activites");
  return {};
}
