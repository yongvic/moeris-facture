import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";
import { produitUpdateSchema } from "../../../../lib/validators/produit";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const produit = await prisma.produit.findUnique({
    where: { id: params.id },
  });

  if (!produit) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: produit });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = produitUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const produit = await prisma.produit.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: produit });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const produit = await prisma.produit.update({
    where: { id: params.id },
    data: { archive: true, disponible: false },
  });

  return NextResponse.json({ data: produit });
}
