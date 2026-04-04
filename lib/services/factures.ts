import { ModePaiement } from "@prisma/client";
import { prisma } from "../prisma";
import { recalcFacture } from "../billing";

type PrismaReadWriteClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type AddConsommationInput = {
  factureId: string;
  categorie: "CHAMBRE" | "RESTAURANT" | "ACTIVITE" | "EVENEMENT" | "DIVERS";
  description: string;
  quantite: number;
  prixUnitaire: number;
  remise?: number | null;
  produitId?: string | null;
  activiteId?: string | null;
};

type AddPaiementInput = {
  factureId: string;
  montant: number;
  modePaiement: ModePaiement;
  reference?: string | null;
  note?: string | null;
  encaisseePar?: string | null;
};

export class FactureServiceError extends Error {}

async function getFactureOrThrow(client: PrismaReadWriteClient, factureId: string) {
  const facture = await client.facture.findUnique({
    where: { id: factureId },
    select: {
      id: true,
      statut: true,
      montantTotal: true,
      montantPaye: true,
    },
  });

  if (!facture) {
    throw new FactureServiceError("Facture introuvable.");
  }

  return facture;
}

export async function addConsommationToFacture(
  input: AddConsommationInput,
  client: PrismaReadWriteClient = prisma
) {
  const facture = await getFactureOrThrow(client, input.factureId);
  if (facture.statut === "ANNULEE") {
    throw new FactureServiceError("Impossible de modifier une facture annulée.");
  }

  const quantite = Number(input.quantite);
  const prixUnitaire = Number(input.prixUnitaire);
  const remise = input.remise ? Number(input.remise) : 0;
  const sousTotalBrut = quantite * prixUnitaire;

  if (remise > sousTotalBrut) {
    throw new FactureServiceError("La remise ne peut pas dépasser le sous-total.");
  }

  const consommation = await client.consommation.create({
    data: {
      factureId: input.factureId,
      categorie: input.categorie,
      description: input.description,
      quantite,
      prixUnitaire,
      remise: input.remise ?? null,
      sousTotal: Math.max(0, sousTotalBrut - remise),
      produitId: input.produitId ?? null,
      activiteId: input.activiteId ?? null,
    },
  });

  await recalcFacture(input.factureId, client);
  return consommation;
}

export async function addPaiementToFacture(
  input: AddPaiementInput,
  client: typeof prisma = prisma
) {
  return client.$transaction(async (tx) => {
    const facture = await getFactureOrThrow(
      tx as PrismaReadWriteClient,
      input.factureId
    );
    if (facture.statut === "ANNULEE") {
      throw new FactureServiceError("Impossible d'encaisser une facture annulée.");
    }

    if (
      ["VIREMENT", "MOBILE_MONEY"].includes(input.modePaiement) &&
      !input.reference
    ) {
      throw new FactureServiceError(
        "Référence obligatoire pour virement ou mobile money."
      );
    }

    const total = Number(facture.montantTotal);
    const paid = Number(facture.montantPaye);
    const remaining = Math.max(0, total - paid);

    if (input.montant > remaining) {
      throw new FactureServiceError("Le montant dépasse le reste à payer.");
    }

    const paiement = await tx.paiement.create({
      data: {
        factureId: input.factureId,
        montant: input.montant,
        modePaiement: input.modePaiement,
        reference: input.reference ?? null,
        note: input.note ?? null,
        encaisseePar: input.encaisseePar ?? null,
      },
    });

    await recalcFacture(input.factureId, tx as PrismaReadWriteClient);
    return paiement;
  });
}
