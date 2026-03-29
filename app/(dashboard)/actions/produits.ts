"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { produitCreateSchema, produitUpdateSchema } from "../../../lib/validators/produit";
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

export async function createProduit(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    nom: normalize(formData.get("nom")) ?? "",
    description: normalize(formData.get("description")),
    prix: toNumber(formData.get("prix")) ?? 0,
    categorie: normalize(formData.get("categorie")) ?? "",
    disponible: formData.get("disponible") === "on",
    archive: false,
    imageUrl: normalize(formData.get("imageUrl")),
  };

  const parsed = produitCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const produit = await prisma.produit.create({
    data: parsed.data,
  });

  revalidatePath("/restaurant/menu");
  redirect(`/restaurant/menu/${produit.id}`);
}

export async function updateProduit(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Produit introuvable." };

  const payload = {
    nom: normalize(formData.get("nom")) ?? "",
    description: normalize(formData.get("description")),
    prix: toNumber(formData.get("prix")) ?? 0,
    categorie: normalize(formData.get("categorie")) ?? "",
    disponible: formData.get("disponible") === "on",
    archive: formData.get("archive") === "on",
    imageUrl: normalize(formData.get("imageUrl")),
  };

  const parsed = produitUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  await prisma.produit.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath(`/restaurant/menu/${id}`);
  revalidatePath("/restaurant/menu");
  return {};
}
