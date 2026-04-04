import { NextResponse } from "next/server";
import { requireRole } from "../../../lib/auth-helpers";
import { paiementCreateSchema } from "../../../lib/validators/paiement";
import {
  addPaiementToFacture,
  FactureServiceError,
} from "../../../lib/services/factures";

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = paiementCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const paiement = await addPaiementToFacture({
      factureId: parsed.data.factureId,
      montant: parsed.data.montant,
      modePaiement: parsed.data.modePaiement,
      reference: parsed.data.reference ?? null,
      note: parsed.data.note ?? null,
      encaisseePar: gate.session.user?.name ?? null,
    });

    return NextResponse.json({ data: paiement }, { status: 201 });
  } catch (error) {
    if (error instanceof FactureServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
