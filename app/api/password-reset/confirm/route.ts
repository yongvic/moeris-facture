import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { passwordResetSchema } from "../../../../lib/validators/auth";
import { zodErrorMessage } from "../../../../lib/validation";
import { hashToken } from "../../../../lib/auth-tokens";
import { rateLimit } from "../../../../lib/rate-limit";
import { getRequestIp } from "../../../../lib/request";
import { createAuditLog } from "../../../../lib/audit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const limit = rateLimit(`password-reset-confirm:${ip}`, {
    max: 5,
    windowMs: 10 * 60 * 1000,
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

  const parsed = passwordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.expiresAt < new Date()) {
    if (record && record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { tokenHash } });
    }
    return NextResponse.json(
      { error: "Lien de réinitialisation invalide ou expiré." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { password: hash },
    });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    await createAuditLog(
      {
        actorId: record.userId,
        action: "AUTH_PASSWORD_RESET_CONFIRMED",
        entityType: "User",
        entityId: record.userId,
        details: { ip },
      },
      tx
    );
  });

  return NextResponse.json({ ok: true });
}
