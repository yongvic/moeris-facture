import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { evenementUpdateSchema } from "../../../../lib/validators/evenement";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: { participants: true, factures: true },
  });

  if (!evenement) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: evenement });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = evenementUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const evenement = await prisma.evenement.update({
    where: { id },
    data: {
      ...parsed.data,
      dateDebut: parsed.data.dateDebut
        ? new Date(parsed.data.dateDebut)
        : undefined,
      dateFin: parsed.data.dateFin ? new Date(parsed.data.dateFin) : undefined,
    },
  });

  return NextResponse.json({ data: evenement });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const evenement = await prisma.evenement.update({
    where: { id },
    data: { statut: "ANNULE" },
  });

  return NextResponse.json({ data: evenement });
}
