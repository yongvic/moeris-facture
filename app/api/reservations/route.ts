import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { reservationCreateSchema } from "../../../lib/validators/reservation";
import {
  createReservationRecord,
  ReservationServiceError,
} from "../../../lib/services/reservations";

export async function GET() {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const reservations = await prisma.reservation.findMany({
    orderBy: { dateArrivee: "desc" },
    include: { client: true, chambre: true },
  });

  return NextResponse.json({ data: reservations });
}

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = reservationCreateSchema.safeParse({
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
    const reservation = await createReservationRecord(parsed.data);
    return NextResponse.json({ data: reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
