"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { chambreCreateSchema, chambreUpdateSchema } from "../../../lib/validators/chambre";
import { zodErrorMessage } from "../../../lib/validation";
import { parseCsvFile, parseNullableString } from "../../../lib/csv";
import { createAuditLog } from "../../../lib/audit";
import { uploadManyImages } from "../../../lib/uploads";

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

  const uploadedPhotos = await uploadManyImages(formData.getAll("photos"), "chambres");

  const payload = {
    numero: normalize(formData.get("numero")) ?? "",
    nom: normalize(formData.get("nom")),
    type: normalize(formData.get("type")) ?? "STANDARD",
    capacite: toNumber(formData.get("capacite")) ?? 1,
    prixNuit: toNumber(formData.get("prixNuit")) ?? 0,
    description: normalize(formData.get("description")),
    equipements: toArray(formData.get("equipements")),
    photoUrls: uploadedPhotos,
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
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CHAMBRE_CREATED",
    entityType: "Chambre",
    entityId: chambre.id,
  });
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

  const uploadedPhotos = await uploadManyImages(formData.getAll("photos"), "chambres");
  const existingPhotoUrls = formData
    .getAll("existingPhotoUrls")
    .map((entry) => entry.toString())
    .filter(Boolean);

  const payload = {
    numero: normalize(formData.get("numero")) ?? "",
    nom: normalize(formData.get("nom")),
    type: normalize(formData.get("type")) ?? "STANDARD",
    capacite: toNumber(formData.get("capacite")) ?? 1,
    prixNuit: toNumber(formData.get("prixNuit")) ?? 0,
    description: normalize(formData.get("description")),
    equipements: toArray(formData.get("equipements")),
    photoUrls: [...existingPhotoUrls, ...uploadedPhotos],
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
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CHAMBRE_UPDATED",
    entityType: "Chambre",
    entityId: id,
  });
  return {};
}

export async function importChambresCsv(
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
    return { error: error instanceof Error ? error.message : "CSV illisible." };
  }

  let imported = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const payload = {
      numero: parseNullableString(row.numero) ?? "",
      nom: parseNullableString(row.nom),
      type: parseNullableString(row.type) ?? "STANDARD",
      capacite: Number(row.capacite ?? 1),
      prixNuit: Number(row.prixNuit ?? 0),
      description: parseNullableString(row.description),
      equipements: parseNullableString(row.equipements)
        ?.split("|")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
      photoUrls: parseNullableString(row.photoUrls)
        ?.split("|")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
      statut: parseNullableString(row.statut) ?? "DISPONIBLE",
      etage: row.etage ? Number(row.etage) : null,
    };

    const parsed = chambreCreateSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push(`Ligne ${index + 2}: ${zodErrorMessage(parsed.error)}`);
      continue;
    }

    try {
      await prisma.chambre.create({ data: parsed.data });
      imported += 1;
    } catch {
      errors.push(`Ligne ${index + 2}: échec d'import.`);
    }
  }

  revalidatePath("/chambres");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CHAMBRES_IMPORTED",
    entityType: "Chambre",
    details: { imported, errors: errors.length },
  });

  if (imported === 0) {
    return { error: errors[0] ?? "Aucune chambre importée." };
  }

  return {
    message:
      errors.length > 0
        ? `${imported} chambres importées, ${errors.length} lignes ignorées.`
        : `${imported} chambres importées.`,
  };
}
