import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { chambreUpdateSchema } from "../../../../lib/validators/chambre";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const chambre = await prisma.chambre.findUnique({
    where: { id },
    include: { reservations: true },
  });

  if (!chambre) {
    return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: chambre });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = chambreUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const chambre = await prisma.chambre.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: chambre });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const chambre = await prisma.chambre.update({
    where: { id },
    data: { statut: "HORS_SERVICE" },
  });

  return NextResponse.json({ data: chambre });
}
