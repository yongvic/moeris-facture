import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { factureUpdateSchema } from "../../../../lib/validators/facture";

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

  const facture = await prisma.facture.update({
    where: { id },
    data: {
      ...parsed.data,
      clotureeAt:
        parsed.data.statut === "PAYEE" ? new Date() : undefined,
    },
  });

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
