"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { clientCreateSchema, clientUpdateSchema } from "../../../lib/validators/client";
import { zodErrorMessage } from "../../../lib/validation";

type FormState = {
  error?: string;
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
  return {};
}
