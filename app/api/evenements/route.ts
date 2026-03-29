import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { evenementCreateSchema } from "../../../lib/validators/evenement";

export async function GET() {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const evenements = await prisma.evenement.findMany({
    orderBy: { dateDebut: "asc" },
  });

  return NextResponse.json({ data: evenements });
}

export async function POST(request: Request) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = evenementCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const evenement = await prisma.evenement.create({
    data: {
      ...parsed.data,
      dateDebut: new Date(parsed.data.dateDebut),
      dateFin: new Date(parsed.data.dateFin),
    },
  });

  return NextResponse.json({ data: evenement }, { status: 201 });
}
