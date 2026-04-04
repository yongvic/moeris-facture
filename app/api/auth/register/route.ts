import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { registerSchema } from "../../../../lib/validators/auth";
import { zodErrorMessage } from "../../../../lib/validation";
import { rateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";
import { createAuditLog } from "../../../../lib/audit";

export async function POST(request: Request) {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== "true") {
    return NextResponse.json(
      { error: "L'inscription publique est désactivée." },
      { status: 403 }
    );
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`register:${ip}`, {
    max: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { password, nom, prenom } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        nom,
        prenom,
        role: "STAFF",
      },
    });
    await createAuditLog({
      actorId: user.id,
      action: "AUTH_REGISTER",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email, ip },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Impossible de créer le compte." },
      { status: 500 }
    );
  }
}
