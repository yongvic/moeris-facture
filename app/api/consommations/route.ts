import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { consommationCreateSchema } from "../../../lib/validators/consommation";
import { recalcFacture } from "../../../lib/billing";

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = consommationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const quantite = Number(parsed.data.quantite);
  const prixUnitaire = Number(parsed.data.prixUnitaire);
  const remise = parsed.data.remise ? Number(parsed.data.remise) : 0;
  const sousTotal = Math.max(0, quantite * prixUnitaire - remise);

  const consommation = await prisma.consommation.create({
    data: {
      factureId: parsed.data.factureId,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      quantite,
      prixUnitaire,
      remise: parsed.data.remise ?? null,
      sousTotal,
      produitId: parsed.data.produitId ?? null,
      activiteId: parsed.data.activiteId ?? null,
    },
  });

  await recalcFacture(parsed.data.factureId);

  return NextResponse.json({ data: consommation }, { status: 201 });
}
