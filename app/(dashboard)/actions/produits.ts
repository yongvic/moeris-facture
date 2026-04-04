"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { produitCreateSchema, produitUpdateSchema } from "../../../lib/validators/produit";
import { zodErrorMessage } from "../../../lib/validation";
import { parseBoolean, parseCsvFile, parseNullableString } from "../../../lib/csv";
import { createAuditLog } from "../../../lib/audit";
import { uploadOptionalImage } from "../../../lib/uploads";

type FormState = { error?: string; message?: string };

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

  const uploadedImage = await uploadOptionalImage(formData.get("imageFile"), "produits");
  if (uploadedImage) {
    payload.imageUrl = uploadedImage;
  }

  const parsed = produitCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const produit = await prisma.produit.create({
    data: parsed.data,
  });

  revalidatePath("/restaurant/menu");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "PRODUIT_CREATED",
    entityType: "Produit",
    entityId: produit.id,
  });
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

  const uploadedImage = await uploadOptionalImage(formData.get("imageFile"), "produits");
  if (uploadedImage) {
    payload.imageUrl = uploadedImage;
  }

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
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "PRODUIT_UPDATED",
    entityType: "Produit",
    entityId: id,
  });
  return {};
}

export async function importProduitsCsv(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Fichier CSV requis." };
  }

  let rows;
  try {
    rows = await parseCsvFile(file);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "CSV illisible.",
    };
  }

  let imported = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const payload = {
      nom: parseNullableString(row.nom) ?? "",
      description: parseNullableString(row.description),
      prix: Number(row.prix ?? 0),
      categorie: parseNullableString(row.categorie) ?? "",
      disponible: parseBoolean(row.disponible, true),
      archive: parseBoolean(row.archive, false),
      imageUrl: parseNullableString(row.imageUrl),
    };

    const parsed = produitCreateSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push(`Ligne ${index + 2}: ${zodErrorMessage(parsed.error)}`);
      continue;
    }

    try {
      await prisma.produit.create({
        data: parsed.data,
      });
      imported += 1;
    } catch {
      errors.push(`Ligne ${index + 2}: échec d'import.`);
    }
  }

  revalidatePath("/restaurant/menu");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "PRODUITS_IMPORTED",
    entityType: "Produit",
    details: { imported, errors: errors.length },
  });

  if (imported === 0) {
    return { error: errors[0] ?? "Aucun produit importé." };
  }

  return {
    message:
      errors.length > 0
        ? `${imported} produits importés, ${errors.length} lignes ignorées.`
        : `${imported} produits importés.`,
  };
}
