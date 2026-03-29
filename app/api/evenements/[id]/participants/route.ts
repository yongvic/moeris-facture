import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/auth-helpers";
import { z } from "zod";

const participantSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  contact: z.string().optional().nullable(),
  statut: z.enum(["INSCRIT", "PRESENT", "ABSENT", "ANNULE"]).optional(),
  acomptePaye: z.number().optional().nullable(),
  soldeRestant: z.number().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const payload = await request.json();
  const parsed = participantSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const participant = await prisma.participantEvenement.create({
    data: {
      evenementId: id,
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      contact: parsed.data.contact ?? null,
      statut: parsed.data.statut ?? "INSCRIT",
      acomptePaye: parsed.data.acomptePaye ?? null,
      soldeRestant: parsed.data.soldeRestant ?? null,
    },
  });

  return NextResponse.json({ data: participant }, { status: 201 });
}
