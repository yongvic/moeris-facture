import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth-helpers";
import { consommationCreateSchema } from "../../../lib/validators/consommation";
import {
  addConsommationToFacture,
  FactureServiceError,
} from "../../../lib/services/factures";

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

  try {
    const consommation = await addConsommationToFacture({
      factureId: parsed.data.factureId,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      quantite: Number(parsed.data.quantite),
      prixUnitaire: Number(parsed.data.prixUnitaire),
      remise: parsed.data.remise ?? null,
      produitId: parsed.data.produitId ?? null,
      activiteId: parsed.data.activiteId ?? null,
    });

    return NextResponse.json({ data: consommation }, { status: 201 });
  } catch (error) {
    if (error instanceof FactureServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
