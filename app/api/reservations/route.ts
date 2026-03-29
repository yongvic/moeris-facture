import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { reservationCreateSchema } from "../../../lib/validators/reservation";

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
  const parsed = reservationCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dateArrivee = new Date(parsed.data.dateArrivee);
  const dateDepart = new Date(parsed.data.dateDepart);

  if (dateDepart <= dateArrivee) {
    return NextResponse.json(
      { error: "La date de départ doit être après la date d'arrivée." },
      { status: 400 }
    );
  }
  const nombreNuits =
    parsed.data.nombreNuits ??
    Math.max(1, Math.ceil((dateDepart.getTime() - dateArrivee.getTime()) / 86400000));

  const overlap = await prisma.reservation.findFirst({
    where: {
      chambreId: parsed.data.chambreId,
      statut: { not: "ANNULEE" },
      OR: [
        {
          dateArrivee: { lte: dateDepart },
          dateDepart: { gte: dateArrivee },
        },
      ],
    },
  });

  if (overlap) {
    return NextResponse.json(
      { error: "Conflit de réservation détecté" },
      { status: 409 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      clientId: parsed.data.clientId,
      chambreId: parsed.data.chambreId,
      dateArrivee,
      dateDepart,
      nombreNuits,
      prixNegocie: parsed.data.prixNegocie ?? null,
      nombreAdultes: parsed.data.nombreAdultes ?? 1,
      nombreEnfants: parsed.data.nombreEnfants ?? 0,
      statut: parsed.data.statut ?? "CONFIRMEE",
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json({ data: reservation }, { status: 201 });
}
