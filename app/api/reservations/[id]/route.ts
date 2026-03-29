import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { reservationUpdateSchema } from "../../../../lib/validators/reservation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { client: true, chambre: true, factures: true },
  });

  if (!reservation) {
    return NextResponse.json(
      { error: "Réservation introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: reservation });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = reservationUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      ...parsed.data,
      dateArrivee: parsed.data.dateArrivee
        ? new Date(parsed.data.dateArrivee)
        : undefined,
      dateDepart: parsed.data.dateDepart
        ? new Date(parsed.data.dateDepart)
        : undefined,
    },
  });

  return NextResponse.json({ data: reservation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { statut: "ANNULEE" },
  });

  return NextResponse.json({ data: reservation });
}
