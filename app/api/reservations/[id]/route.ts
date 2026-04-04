import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { reservationUpdateSchema } from "../../../../lib/validators/reservation";
import {
  ReservationServiceError,
  transitionReservationStatus,
  updateReservationRecord,
} from "../../../../lib/services/reservations";

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
  const parsed = reservationUpdateSchema.safeParse({
    ...payload,
    statut: undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const reservation = await updateReservationRecord(id, parsed.data);
    return NextResponse.json({ data: reservation });
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      const status = error.message === "Réservation introuvable." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const current = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  try {
    const reservation = await transitionReservationStatus(id, "ANNULEE");
    return NextResponse.json({ data: reservation });
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      const status = error.message === "Réservation introuvable." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
