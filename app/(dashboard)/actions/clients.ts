"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { clientCreateSchema, clientUpdateSchema } from "../../../lib/validators/client";
import { zodErrorMessage } from "../../../lib/validation";
import { parseCsvFile, parseNullableString } from "../../../lib/csv";
import { createAuditLog } from "../../../lib/audit";

type FormState = {
  error?: string;
  message?: string;
};

const normalize = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

export async function createClient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) {
    return { error: "Non autorisé." };
  }

  const payload = {
    prenom: normalize(formData.get("prenom")) ?? "",
    nom: normalize(formData.get("nom")),
    email: normalize(formData.get("email")),
    telephone: normalize(formData.get("telephone")),
    dateNaissance: normalize(formData.get("dateNaissance")),
    nationalite: normalize(formData.get("nationalite")),
    numeroPiece: normalize(formData.get("numeroPiece")),
    adresse: normalize(formData.get("adresse")),
    notes: normalize(formData.get("notes")),
    segment: normalize(formData.get("segment")) ?? undefined,
  };

  const parsed = clientCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      dateNaissance:
        "dateNaissance" in parsed.data && parsed.data.dateNaissance
          ? new Date(parsed.data.dateNaissance)
          : null,
    },
  });

  revalidatePath("/clients");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CLIENT_CREATED",
    entityType: "Client",
    entityId: client.id,
  });
  redirect(`/clients/${client.id}`);
}

export async function updateClient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) {
    return { error: "Non autorisé." };
  }

  const id = formData.get("id")?.toString();
  if (!id) {
    return { error: "Client introuvable." };
  }

  const payload = {
    prenom: normalize(formData.get("prenom")) ?? "",
    nom: normalize(formData.get("nom")),
    email: normalize(formData.get("email")),
    telephone: normalize(formData.get("telephone")),
    dateNaissance: normalize(formData.get("dateNaissance")),
    nationalite: normalize(formData.get("nationalite")),
    numeroPiece: normalize(formData.get("numeroPiece")),
    adresse: normalize(formData.get("adresse")),
    notes: normalize(formData.get("notes")),
    segment: normalize(formData.get("segment")) ?? undefined,
  };

  const parsed = clientUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  await prisma.client.update({
    where: { id },
    data: {
      ...parsed.data,
      dateNaissance: parsed.data.dateNaissance
        ? new Date(parsed.data.dateNaissance)
        : undefined,
    },
  });

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: id,
  });
  return {};
}

export async function importClientsCsv(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) {
    return { error: "Non autorisé." };
  }

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

  if (rows.length === 0) {
    return { error: "Le fichier CSV est vide." };
  }

  let imported = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const payload = {
      prenom: parseNullableString(row.prenom) ?? "",
      nom: parseNullableString(row.nom),
      email: parseNullableString(row.email),
      telephone: parseNullableString(row.telephone),
      dateNaissance: parseNullableString(row.dateNaissance),
      nationalite: parseNullableString(row.nationalite),
      numeroPiece: parseNullableString(row.numeroPiece),
      adresse: parseNullableString(row.adresse),
      notes: parseNullableString(row.notes),
      segment: parseNullableString(row.segment) ?? undefined,
    };

    const parsed = clientCreateSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push(`Ligne ${index + 2}: ${zodErrorMessage(parsed.error)}`);
      continue;
    }

    try {
      const email = "email" in parsed.data ? parsed.data.email ?? null : null;
      const data = {
        ...parsed.data,
        email,
        dateNaissance:
          "dateNaissance" in parsed.data && parsed.data.dateNaissance
            ? new Date(parsed.data.dateNaissance)
            : null,
      };

      if (email) {
        const existing = await prisma.client.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existing) {
          await prisma.client.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.client.create({ data });
        }
      } else {
        await prisma.client.create({ data });
      }

      imported += 1;
    } catch {
      errors.push(`Ligne ${index + 2}: échec d'import.`);
    }
  }

  revalidatePath("/clients");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "CLIENTS_IMPORTED",
    entityType: "Client",
    details: { imported, errors: errors.length },
  });

  if (imported === 0) {
    return { error: errors[0] ?? "Aucun client importé." };
  }

  return {
    message:
      errors.length > 0
        ? `${imported} clients importés, ${errors.length} lignes ignorées.`
        : `${imported} clients importés.`,
  };
}
