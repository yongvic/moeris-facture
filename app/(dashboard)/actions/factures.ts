"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { factureCreateSchema, factureUpdateSchema } from "../../../lib/validators/facture";
import { consommationCreateSchema } from "../../../lib/validators/consommation";
import { paiementCreateSchema } from "../../../lib/validators/paiement";
import { generateFactureNumero } from "../../../lib/invoice";
import { recalcFacture } from "../../../lib/billing";
import { zodErrorMessage } from "../../../lib/validation";

type FormState = { error?: string };

const toNumber = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const normalize = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

export async function createFacture(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    clientId: normalize(formData.get("clientId")) ?? "",
    reservationId: normalize(formData.get("reservationId")),
    evenementId: normalize(formData.get("evenementId")),
    notes: normalize(formData.get("notes")),
    remiseGlobale: toNumber(formData.get("remiseGlobale")),
    remisePourcent: toNumber(formData.get("remisePourcent")),
  };

  const parsed = factureCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  const numero = await generateFactureNumero();
  const facture = await prisma.facture.create({
    data: {
      numero,
      clientId: parsed.data.clientId,
      reservationId: parsed.data.reservationId ?? null,
      evenementId: parsed.data.evenementId ?? null,
      notes: parsed.data.notes ?? null,
      remiseGlobale: parsed.data.remiseGlobale ?? null,
      remisePourcent: parsed.data.remisePourcent ?? null,
    },
  });

  revalidatePath("/factures");
  redirect(`/factures/${facture.id}`);
}

export async function updateFactureStatus(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get("id")?.toString();
  const statut = formData.get("statut")?.toString();

  if (!id || !statut) return { error: "Paramètres invalides." };

  const gate = await requireRole(statut === "ANNULEE" ? "ADMIN" : "STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const parsed = factureUpdateSchema.safeParse({ statut });
  if (!parsed.success) {
    return { error: "Statut invalide." };
  }

  await prisma.facture.update({
    where: { id },
    data: {
      statut: parsed.data.statut,
      clotureeAt: parsed.data.statut === "PAYEE" ? new Date() : undefined,
    },
  });

  revalidatePath(`/factures/${id}`);
  revalidatePath("/factures");
  return {};
}

export async function addConsommation(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    factureId: normalize(formData.get("factureId")) ?? "",
    categorie: normalize(formData.get("categorie")) ?? "DIVERS",
    description: normalize(formData.get("description")) ?? "",
    quantite: toNumber(formData.get("quantite")) ?? 1,
    prixUnitaire: toNumber(formData.get("prixUnitaire")) ?? 0,
    remise: toNumber(formData.get("remise")),
  };

  const parsed = consommationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error, "Consommation invalide.") };
  }

  const quantite = Number(parsed.data.quantite);
  const prixUnitaire = Number(parsed.data.prixUnitaire);
  const remise = parsed.data.remise ? Number(parsed.data.remise) : 0;
  const sousTotalBrut = quantite * prixUnitaire;
  if (remise > sousTotalBrut) {
    return { error: "La remise ne peut pas dépasser le sous-total." };
  }
  const sousTotal = Math.max(0, quantite * prixUnitaire - remise);

  await prisma.consommation.create({
    data: {
      factureId: parsed.data.factureId,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      quantite,
      prixUnitaire,
      remise: parsed.data.remise ?? null,
      sousTotal,
    },
  });

  await recalcFacture(parsed.data.factureId);
  revalidatePath(`/factures/${parsed.data.factureId}`);
  revalidatePath("/factures");
  return {};
}

export async function addPaiement(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const payload = {
    factureId: normalize(formData.get("factureId")) ?? "",
    montant: toNumber(formData.get("montant")) ?? 0,
    modePaiement: normalize(formData.get("modePaiement")) ?? "ESPECES",
    reference: normalize(formData.get("reference")),
    note: normalize(formData.get("note")),
  };

  const parsed = paiementCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error, "Paiement invalide.") };
  }

  if (
    ["VIREMENT", "MOBILE_MONEY"].includes(parsed.data.modePaiement) &&
    !parsed.data.reference
  ) {
    return { error: "Référence obligatoire pour virement ou mobile money." };
  }

  const facture = await prisma.facture.findUnique({
    where: { id: parsed.data.factureId },
    select: { montantTotal: true, montantPaye: true, statut: true },
  });

  if (!facture) {
    return { error: "Facture introuvable." };
  }
  if (facture.statut === "ANNULEE") {
    return { error: "Impossible d'encaisser une facture annulée." };
  }

  const total = Number(facture.montantTotal);
  const paid = Number(facture.montantPaye);
  const remaining = Math.max(0, total - paid);
  if (parsed.data.montant > remaining) {
    return { error: "Le montant dépasse le reste à payer." };
  }

  await prisma.paiement.create({
    data: {
      factureId: parsed.data.factureId,
      montant: parsed.data.montant,
      modePaiement: parsed.data.modePaiement,
      reference: parsed.data.reference ?? null,
      note: parsed.data.note ?? null,
    },
  });

  await recalcFacture(parsed.data.factureId);
  revalidatePath(`/factures/${parsed.data.factureId}`);
  revalidatePath("/factures");
  return {};
}
