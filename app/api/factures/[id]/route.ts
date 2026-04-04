import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { factureUpdateSchema } from "../../../../lib/validators/facture";
import { recalcFacture } from "../../../../lib/billing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const facture = await prisma.facture.findUnique({
    where: { id },
    include: {
      client: true,
      consommations: true,
      paiements: true,
    },
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: facture });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = factureUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.statut && parsed.data.statut !== "ANNULEE") {
    return NextResponse.json(
      { error: "Le statut ne peut plus être forcé. Utilisez les paiements." },
      { status: 400 }
    );
  }

  const currentFacture = await prisma.facture.findUnique({
    where: { id },
    select: { montantPaye: true, statut: true },
  });
  if (!currentFacture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (parsed.data.statut === "ANNULEE" && Number(currentFacture.montantPaye) > 0) {
    return NextResponse.json(
      { error: "Impossible d'annuler une facture avec paiements enregistrés." },
      { status: 400 }
    );
  }

  const facture = await prisma.facture.update({
    where: { id },
    data: {
      ...(parsed.data.statut === "ANNULEE" ? { statut: "ANNULEE", clotureeAt: null } : {}),
      ...(parsed.data.tauxTva !== undefined && parsed.data.tauxTva !== null
        ? { tauxTva: parsed.data.tauxTva }
        : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.remiseGlobale !== undefined
        ? { remiseGlobale: parsed.data.remiseGlobale }
        : {}),
      ...(parsed.data.remisePourcent !== undefined
        ? { remisePourcent: parsed.data.remisePourcent }
        : {}),
    },
  });

  if (
    parsed.data.tauxTva !== undefined ||
    parsed.data.remiseGlobale !== undefined ||
    parsed.data.remisePourcent !== undefined
  ) {
    await recalcFacture(id);
  }

  return NextResponse.json({ data: facture });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const facture = await prisma.facture.update({
    where: { id },
    data: { statut: "ANNULEE", clotureeAt: new Date() },
  });

  return NextResponse.json({ data: facture });
}
