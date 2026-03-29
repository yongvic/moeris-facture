import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { produitCreateSchema } from "../../../lib/validators/produit";

export async function GET() {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const produits = await prisma.produit.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: produits });
}

export async function POST(request: Request) {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = produitCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const produit = await prisma.produit.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: produit }, { status: 201 });
}
