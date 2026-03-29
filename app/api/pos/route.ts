import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { generateFactureNumero } from "../../../lib/invoice";
import { recalcFacture } from "../../../lib/billing";

// Schéma Zod strict : qty doit être un entier >= 1 pour empêcher
// toute manipulation de prix via des quantités négatives ou nulles.
const posSchema = z.object({
  clientId: z.string().optional(),
  client: z
    .object({
      prenom: z.string().min(1, "Prénom requis"),
      telephone: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        qty: z.number().int().min(1, "Quantité minimale : 1"),
      })
    )
    .min(1, "Panier vide."),
  modePaiement: z.enum([
    "ESPECES",
    "VIREMENT",
    "MOBILE_MONEY",
    "CARTE_BANCAIRE",
    "CHEQUE",
    "AUTRE",
  ]),
  reference: z.string().optional(),
});

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = posSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload invalide." },
      { status: 400 }
    );
  }

  const payload = parsed.data;

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

  const produitMap = new Map(produits.map((produit) => [produit.id, produit]));

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
      const quantite = item.qty; // déjà validé >= 1 par Zod
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

    const montantTotal = payload.items.reduce((acc, item) => {
      const produit = produitMap.get(item.id);
      if (!produit) return acc;
      return acc + item.qty * Number(produit.prix);
    }, 0);

    await tx.paiement.create({
      data: {
        factureId: facture.id,
        montant: montantTotal,
        modePaiement: payload.modePaiement,
        reference: payload.reference ?? null,
      },
    });

    await recalcFacture(facture.id, tx);
    return facture;
  });

  return NextResponse.json({ data: facture });
}
