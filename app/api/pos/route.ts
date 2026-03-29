import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { generateFactureNumero } from "../../../lib/invoice";
import { recalcFacture } from "../../../lib/billing";

type PosPayload = {
  clientId?: string;
  client?: {
    prenom: string;
    telephone?: string;
  };
  items: Array<{ id: string; qty: number }>;
  modePaiement: string;
  reference?: string;
};

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = (await request.json()) as PosPayload;

  if (!payload.items || payload.items.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  if (
    ["VIREMENT", "MOBILE_MONEY"].includes(payload.modePaiement) &&
    !payload.reference
  ) {
    return NextResponse.json(
      { error: "Référence obligatoire pour virement ou mobile money." },
      { status: 400 }
    );
  }

  const itemIds = payload.items.map((item) => item.id);
  const produits = await prisma.produit.findMany({
    where: { id: { in: itemIds }, archive: false },
  });

  if (produits.length !== itemIds.length) {
    return NextResponse.json(
      { error: "Un ou plusieurs produits sont indisponibles." },
      { status: 400 }
    );
  }

  const produitMap = new Map(
    produits.map((produit) => [produit.id, produit])
  );

  const facture = await prisma.$transaction(async (tx) => {
    let clientId = payload.clientId;
    if (!clientId) {
      if (!payload.client?.prenom) {
        throw new Error("Client manquant.");
      }
      const client = await tx.client.create({
        data: {
          prenom: payload.client.prenom,
          telephone: payload.client.telephone ?? null,
        },
      });
      clientId = client.id;
    }

    const numero = await generateFactureNumero(tx);
    const facture = await tx.facture.create({
      data: {
        numero,
        clientId,
        notes: "POS restaurant",
      },
    });

    for (const item of payload.items) {
      const produit = produitMap.get(item.id);
      if (!produit) continue;
      const quantite = Math.max(1, item.qty);
      const prixUnitaire = Number(produit.prix);
      const sousTotal = quantite * prixUnitaire;

      await tx.consommation.create({
        data: {
          factureId: facture.id,
          categorie: "RESTAURANT",
          description: produit.nom,
          quantite,
          prixUnitaire,
          sousTotal,
          produitId: produit.id,
        },
      });
    }

    await tx.paiement.create({
      data: {
        factureId: facture.id,
        montant: payload.items.reduce((acc, item) => {
          const produit = produitMap.get(item.id);
          if (!produit) return acc;
          return acc + Math.max(1, item.qty) * Number(produit.prix);
        }, 0),
        modePaiement: payload.modePaiement as any,
        reference: payload.reference ?? null,
      },
    });

    await recalcFacture(facture.id, tx);
    return facture;
  });

  return NextResponse.json({ data: facture });
}
