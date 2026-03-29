import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { chambreCreateSchema } from "../../../lib/validators/chambre";

export async function GET() {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const chambres = await prisma.chambre.findMany({
    orderBy: { numero: "asc" },
  });

  return NextResponse.json({ data: chambres });
}

export async function POST(request: Request) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = chambreCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const chambre = await prisma.chambre.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: chambre }, { status: 201 });
}
