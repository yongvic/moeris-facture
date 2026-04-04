"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { activiteCreateSchema, activiteUpdateSchema } from "../../../lib/validators/activite";
import { zodErrorMessage } from "../../../lib/validation";
import { parseBoolean, parseCsvFile, parseNullableString } from "../../../lib/csv";
import { createAuditLog } from "../../../lib/audit";

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
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "ACTIVITE_CREATED",
    entityType: "Activite",
    entityId: activite.id,
  });
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
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "ACTIVITE_UPDATED",
    entityType: "Activite",
    entityId: id,
  });
  return {};
}

export async function importActivitesCsv(
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
      nom: parseNullableString(row.nom) ?? "",
      description: parseNullableString(row.description),
      prix: Number(row.prix ?? 0),
      prixParUnite: parseNullableString(row.prixParUnite) ?? "personne",
      gratuit: parseBoolean(row.gratuit, false),
      capaciteMax: row.capaciteMax ? Number(row.capaciteMax) : null,
      disponible: parseBoolean(row.disponible, true),
    };

    if (payload.gratuit) {
      payload.prix = 0;
    }

    const parsed = activiteCreateSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push(`Ligne ${index + 2}: ${zodErrorMessage(parsed.error)}`);
      continue;
    }

    try {
      await prisma.activite.create({ data: parsed.data });
      imported += 1;
    } catch {
      errors.push(`Ligne ${index + 2}: échec d'import.`);
    }
  }

  revalidatePath("/activites");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "ACTIVITES_IMPORTED",
    entityType: "Activite",
    details: { imported, errors: errors.length },
  });

  if (imported === 0) {
    return { error: errors[0] ?? "Aucune activité importée." };
  }

  return {
    message:
      errors.length > 0
        ? `${imported} activités importées, ${errors.length} lignes ignorées.`
        : `${imported} activités importées.`,
  };
}
