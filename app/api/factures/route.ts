import { NextResponse } from "next/server";
import { StatutFacture } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { factureCreateSchema } from "../../../lib/validators/facture";
import { generateFactureNumero } from "../../../lib/invoice";

export async function GET(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const statutParam = searchParams.get("statut") ?? undefined;
  const statut =
    statutParam && (Object.values(StatutFacture) as string[]).includes(statutParam)
      ? (statutParam as StatutFacture)
      : undefined;
  const clientId = searchParams.get("clientId") ?? undefined;
  const take = Number(searchParams.get("take") ?? 50);
  const skip = Number(searchParams.get("skip") ?? 0);

  const factures = await prisma.facture.findMany({
    where: {
      statut,
      clientId: clientId ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    include: {
      client: true,
      paiements: true,
    },
  });

  return NextResponse.json({ data: factures });
}

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = factureCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const numero = await generateFactureNumero();

  const facture = await prisma.facture.create({
    data: {
      numero,
      clientId: parsed.data.clientId,
      reservationId: parsed.data.reservationId ?? null,
      evenementId: parsed.data.evenementId ?? null,
      notes: parsed.data.notes ?? null,
      remiseGlobale: parsed.data.remiseGlobale ?? null,
      remisePourcent: parsed.data.remisePourcent ?? null,
    },
  });

  return NextResponse.json({ data: facture }, { status: 201 });
}
