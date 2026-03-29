import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { clientCreateSchema } from "../../../lib/validators/client";

export async function GET(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const segment = searchParams.get("segment")?.trim() ?? undefined;
  const take = Number(searchParams.get("take") ?? 50);
  const skip = Number(searchParams.get("skip") ?? 0);

  const clients = await prisma.client.findMany({
    where: {
      actif: true,
      segment: segment as any,
      OR: q
        ? [
            { prenom: { contains: q, mode: "insensitive" } },
            { nom: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { telephone: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return NextResponse.json({ data: clients });
}

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = clientCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      dateNaissance: parsed.data.dateNaissance
        ? new Date(parsed.data.dateNaissance)
        : null,
    },
  });

  return NextResponse.json({ data: client }, { status: 201 });
}
