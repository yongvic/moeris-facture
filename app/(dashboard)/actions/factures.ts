"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { factureCreateSchema, factureUpdateSchema } from "../../../lib/validators/facture";
import { consommationCreateSchema } from "../../../lib/validators/consommation";
import { paiementCreateSchema } from "../../../lib/validators/paiement";
import { generateFactureNumero } from "../../../lib/invoice";
import {
  addConsommationToFacture,
  addPaiementToFacture,
  FactureServiceError,
} from "../../../lib/services/factures";
import { recalcFacture } from "../../../lib/billing";
import { zodErrorMessage } from "../../../lib/validation";
import { createAuditLog } from "../../../lib/audit";

type FormState = { error?: string };
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
const defaultTvaRate = Number(process.env.DEFAULT_TVA_RATE ?? 18);

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
    tauxTva: toNumber(formData.get("tauxTva")) ?? defaultTvaRate,
    notes: normalize(formData.get("notes")),
    remiseGlobale: toNumber(formData.get("remiseGlobale")),
    remisePourcent: toNumber(formData.get("remisePourcent")),
  };

  const parsed = factureCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }
  if (parsed.data.reservationId && parsed.data.evenementId) {
    return { error: "Une facture ne peut pas être liée à une réservation et un événement en même temps." };
  }

  let facture;
  try {
    facture = await prisma.$transaction(async (tx: TransactionClient) => {
      let reservationData:
        | {
            id: string;
            clientId: string;
            nombreNuits: number;
            prixNegocie: number | null;
            chambre: { numero: string; nom: string | null; prixNuit: number };
          }
        | null = null;
      let evenementData:
        | {
            id: string;
            titre: string;
            prixForfait: number | null;
          }
        | null = null;

      if (parsed.data.reservationId) {
        const existingFacture = await tx.facture.findFirst({
          where: {
            reservationId: parsed.data.reservationId,
            statut: { not: "ANNULEE" },
          },
          select: { id: true },
        });
        if (existingFacture) {
          redirect(`/factures/${existingFacture.id}`);
        }

        const reservation = await tx.reservation.findUnique({
          where: { id: parsed.data.reservationId },
          select: {
            id: true,
            clientId: true,
            nombreNuits: true,
            prixNegocie: true,
            chambre: {
              select: { numero: true, nom: true, prixNuit: true },
            },
          },
        });
        if (!reservation) {
          throw new Error("Réservation introuvable.");
        }
        if (reservation.clientId !== parsed.data.clientId) {
          throw new Error("Le client sélectionné ne correspond pas à la réservation.");
        }
        reservationData = {
          ...reservation,
          prixNegocie: reservation.prixNegocie ? Number(reservation.prixNegocie) : null,
          chambre: {
            ...reservation.chambre,
            prixNuit: Number(reservation.chambre.prixNuit),
          },
        };
      }

      if (parsed.data.evenementId) {
        const evenement = await tx.evenement.findUnique({
          where: { id: parsed.data.evenementId },
          select: { id: true, titre: true, prixForfait: true },
        });
        if (!evenement) {
          throw new Error("Événement introuvable.");
        }
        evenementData = {
          ...evenement,
          prixForfait: evenement.prixForfait ? Number(evenement.prixForfait) : null,
        };
      }

      const numero = await generateFactureNumero(tx);
      const createdFacture = await tx.facture.create({
        data: {
          numero,
          clientId: parsed.data.clientId,
          reservationId: parsed.data.reservationId ?? null,
          evenementId: parsed.data.evenementId ?? null,
          tauxTva: parsed.data.tauxTva ?? defaultTvaRate,
          notes: parsed.data.notes ?? null,
          remiseGlobale: parsed.data.remiseGlobale ?? null,
          remisePourcent: parsed.data.remisePourcent ?? null,
        },
      });

      if (reservationData) {
        const prixNuit = reservationData.prixNegocie ?? reservationData.chambre.prixNuit;
        await tx.consommation.create({
          data: {
            factureId: createdFacture.id,
            categorie: "CHAMBRE",
            description: `Séjour ${reservationData.chambre.nom ?? reservationData.chambre.numero} (${reservationData.nombreNuits} nuit(s))`,
            quantite: reservationData.nombreNuits,
            prixUnitaire: prixNuit,
            sousTotal: reservationData.nombreNuits * prixNuit,
          },
        });
      }

      if (evenementData?.prixForfait && evenementData.prixForfait > 0) {
        await tx.consommation.create({
          data: {
            factureId: createdFacture.id,
            categorie: "EVENEMENT",
            description: `Forfait événement - ${evenementData.titre}`,
            quantite: 1,
            prixUnitaire: evenementData.prixForfait,
            sousTotal: evenementData.prixForfait,
          },
        });
      }

      await recalcFacture(createdFacture.id, tx);
      await createAuditLog(
        {
          actorId: gate.session.user?.id ?? null,
          action: "FACTURE_CREATED",
          entityType: "Facture",
          entityId: createdFacture.id,
          details: {
            clientId: createdFacture.clientId,
            reservationId: createdFacture.reservationId,
            evenementId: createdFacture.evenementId,
          },
        },
        tx
      );
      return createdFacture;
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer la facture.",
    };
  }

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

  if (statut !== "ANNULEE") {
    return { error: "Le statut ne peut plus être forcé manuellement. Utilisez les paiements pour solder la facture." };
  }

  const facture = await prisma.facture.findUnique({
    where: { id },
    select: { montantPaye: true, statut: true },
  });
  if (!facture) {
    return { error: "Facture introuvable." };
  }
  if (Number(facture.montantPaye) > 0) {
    return { error: "Impossible d'annuler une facture avec paiements enregistrés." };
  }
  if (facture.statut === "ANNULEE") {
    return { error: "La facture est déjà annulée." };
  }

  await prisma.facture.update({
    where: { id },
    data: {
      statut: "ANNULEE",
      clotureeAt: null,
    },
  });
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "FACTURE_STATUS_UPDATED",
    entityType: "Facture",
    entityId: id,
    details: { statut: "ANNULEE" },
  });

  revalidatePath(`/factures/${id}`);
  revalidatePath("/factures");
  return {};
}

export async function updateFactureSettings(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = normalize(formData.get("id"));
  if (!id) return { error: "Facture introuvable." };

  const payload = {
    tauxTva: toNumber(formData.get("tauxTva")),
    remiseGlobale: toNumber(formData.get("remiseGlobale")),
    remisePourcent: toNumber(formData.get("remisePourcent")),
    notes: normalize(formData.get("notes")),
  };

  const parsed = factureUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error) };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.facture.update({
      where: { id },
      data: {
        tauxTva:
          parsed.data.tauxTva === null || parsed.data.tauxTva === undefined
            ? undefined
            : parsed.data.tauxTva,
        remiseGlobale:
          parsed.data.remiseGlobale === undefined
            ? undefined
            : parsed.data.remiseGlobale,
        remisePourcent:
          parsed.data.remisePourcent === undefined
            ? undefined
            : parsed.data.remisePourcent,
        notes: parsed.data.notes === undefined ? undefined : parsed.data.notes,
      },
    });
    await recalcFacture(id, tx);
    await createAuditLog(
      {
        actorId: gate.session.user?.id ?? null,
        action: "FACTURE_FINANCIAL_SETTINGS_UPDATED",
        entityType: "Facture",
        entityId: id,
        details: payload,
      },
      tx
    );
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
    produitId: normalize(formData.get("produitId")),
    activiteId: normalize(formData.get("activiteId")),
  };

  const parsed = consommationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error, "Consommation invalide.") };
  }

  let description = parsed.data.description;
  let prixUnitaire = Number(parsed.data.prixUnitaire);
  const quantite = Number(parsed.data.quantite);

  if (parsed.data.categorie === "RESTAURANT" && parsed.data.produitId) {
    const produit = await prisma.produit.findUnique({
      where: { id: parsed.data.produitId },
      select: { nom: true, prix: true, archive: true, disponible: true },
    });
    if (!produit || produit.archive || !produit.disponible) {
      return { error: "Produit indisponible." };
    }
    description = produit.nom;
    prixUnitaire = Number(produit.prix);
  }

  if (parsed.data.categorie === "ACTIVITE" && parsed.data.activiteId) {
    const activite = await prisma.activite.findUnique({
      where: { id: parsed.data.activiteId },
      select: {
        nom: true,
        prix: true,
        prixParUnite: true,
        gratuit: true,
        disponible: true,
      },
    });
    if (!activite || !activite.disponible) {
      return { error: "Activité indisponible." };
    }
    description = `${activite.nom} (${activite.prixParUnite})`;
    prixUnitaire = activite.gratuit ? 0 : Number(activite.prix);
  }

  try {
    await addConsommationToFacture({
      factureId: parsed.data.factureId,
      categorie: parsed.data.categorie,
      description,
      quantite,
      prixUnitaire,
      remise: parsed.data.remise ?? null,
      produitId: parsed.data.produitId ?? null,
      activiteId: parsed.data.activiteId ?? null,
    });
  } catch (error) {
    if (error instanceof FactureServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/factures/${parsed.data.factureId}`);
  revalidatePath("/factures");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "FACTURE_CONSOMMATION_ADDED",
    entityType: "Facture",
    entityId: parsed.data.factureId,
    details: {
      categorie: parsed.data.categorie,
      description,
      quantite,
      prixUnitaire,
    },
  });
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

  try {
    await addPaiementToFacture({
      factureId: parsed.data.factureId,
      montant: parsed.data.montant,
      modePaiement: parsed.data.modePaiement,
      reference: parsed.data.reference ?? null,
      note: parsed.data.note ?? null,
      encaisseePar: gate.session.user?.name ?? null,
    });
  } catch (error) {
    if (error instanceof FactureServiceError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/factures/${parsed.data.factureId}`);
  revalidatePath("/factures");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "FACTURE_PAYMENT_ADDED",
    entityType: "Facture",
    entityId: parsed.data.factureId,
    details: {
      montant: parsed.data.montant,
      modePaiement: parsed.data.modePaiement,
    },
  });
  return {};
}
