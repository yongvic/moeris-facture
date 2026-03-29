import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { activiteUpdateSchema } from "../../../../lib/validators/activite";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const activite = await prisma.activite.findUnique({
    where: { id },
  });

  if (!activite) {
    return NextResponse.json({ error: "Activité introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: activite });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = activiteUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const activite = await prisma.activite.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: activite });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const activite = await prisma.activite.update({
    where: { id },
    data: { disponible: false },
  });

  return NextResponse.json({ data: activite });
}
