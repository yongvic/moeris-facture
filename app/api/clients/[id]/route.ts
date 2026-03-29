import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { clientUpdateSchema } from "../../../../lib/validators/client";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      factures: true,
      reservations: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: client });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = clientUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      dateNaissance: parsed.data.dateNaissance
        ? new Date(parsed.data.dateNaissance)
        : undefined,
    },
  });

  return NextResponse.json({ data: client });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const client = await prisma.client.update({
    where: { id: params.id },
    data: { actif: false },
  });

  return NextResponse.json({ data: client });
}
