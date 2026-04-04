"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "../../../lib/validators/auth";
import { zodErrorMessage } from "../../../lib/validation";
import { createAuditLog } from "../../../lib/audit";

type FormState = { error?: string };

const normalize = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

export async function createStaffUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) {
    return { error: "Non autorisé." };
  }

  const payload = {
    prenom: normalize(formData.get("prenom")) ?? "",
    nom: normalize(formData.get("nom")) ?? "",
    email: normalize(formData.get("email")) ?? "",
    password: normalize(formData.get("password")) ?? "",
    role: normalize(formData.get("role")) ?? "STAFF",
  };

  const parsed = adminUserCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return { error: "Un utilisateur existe déjà avec cet email." };
  }

  const password = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      prenom: parsed.data.prenom,
      nom: parsed.data.nom,
      email: normalizedEmail,
      password,
      role: parsed.data.role,
      actif: true,
    },
  });
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "ADMIN_USER_CREATED",
    entityType: "User",
    entityId: user.id,
    details: { email: user.email, role: user.role },
  });

  revalidatePath("/settings");
  return {};
}

export async function updateStaffUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) {
    return { error: "Non autorisé." };
  }

  const payload = {
    userId: normalize(formData.get("userId")) ?? "",
    role: normalize(formData.get("role")) ?? undefined,
    actif: formData.get("actif")?.toString() === "true",
  };

  const parsed = adminUserUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return { error: "Utilisateur introuvable." };
  }

  const currentUserId = gate.session.user?.email
    ? (
        await prisma.user.findUnique({
          where: { email: gate.session.user.email },
          select: { id: true },
        })
      )?.id
    : null;

  if (
    currentUserId === user.id &&
    (parsed.data.actif === false || parsed.data.role === "STAFF")
  ) {
    return { error: "Vous ne pouvez pas désactiver ou rétrograder votre propre compte." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      role: parsed.data.role,
      actif: parsed.data.actif,
    },
  });
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "ADMIN_USER_UPDATED",
    entityType: "User",
    entityId: parsed.data.userId,
    details: {
      role: parsed.data.role,
      actif: parsed.data.actif,
    },
  });

  revalidatePath("/settings");
  return {};
}
