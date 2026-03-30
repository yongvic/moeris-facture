import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { passwordResetRequestSchema } from "../../../../../lib/validators/auth";
import { zodErrorMessage } from "../../../../../lib/validation";
import { generateResetToken, hashToken } from "../../../../../lib/auth-tokens";
import { sendPasswordResetEmail } from "../../../../../lib/email";
import { getBaseUrl, getRequestIp } from "../../../../../lib/request";
import { rateLimit } from "../../../../../lib/rate-limit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`password-reset:${ip}`, {
    max: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.actif) {
    return NextResponse.json({ ok: true });
  }

  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  const baseUrl = getBaseUrl(request);
  const resetUrl = `${baseUrl}/reset-password/${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: `${user.prenom} ${user.nom}`.trim(),
      resetUrl,
    });
  } catch (error) {
    console.error("Erreur envoi reset:", error);
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    return NextResponse.json(
      { error: "Impossible d'envoyer l'email de réinitialisation." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
