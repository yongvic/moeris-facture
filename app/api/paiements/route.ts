import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { paiementCreateSchema } from "../../../lib/validators/paiement";
import { recalcFacture } from "../../../lib/billing";

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

  const paiement = await prisma.paiement.create({
    data: {
      factureId: parsed.data.factureId,
      montant: parsed.data.montant,
      modePaiement: parsed.data.modePaiement,
      reference: parsed.data.reference ?? null,
      note: parsed.data.note ?? null,
    },
  });

  await recalcFacture(parsed.data.factureId);

  return NextResponse.json({ data: paiement }, { status: 201 });
}
