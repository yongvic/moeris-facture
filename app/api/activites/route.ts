import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { activiteCreateSchema } from "../../../lib/validators/activite";

export async function GET() {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const activites = await prisma.activite.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: activites });
}

export async function POST(request: Request) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = activiteCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const activite = await prisma.activite.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: activite }, { status: 201 });
}
