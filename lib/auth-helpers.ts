import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export type RoleName = "ADMIN" | "MANAGER" | "STAFF";

const roleRank: Record<RoleName, number> = {
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
};

const isAtLeast = (role: RoleName, minRole: RoleName) =>
  roleRank[role] >= roleRank[minRole];

export async function requireRole(minRole: RoleName) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as RoleName | undefined;

  if (!session?.user || !role) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAtLeast(role, minRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const userId = session.user.id;
  const email = session.user.email?.trim().toLowerCase();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, actif: true },
      })
    : email
      ? await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true, actif: true },
        })
      : null;

  if (!user || !user.actif) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbRole = user.role as RoleName;
  if (!isAtLeast(dbRole, minRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        id: user.id,
        email: user.email,
        role: dbRole,
      },
    },
    role: dbRole,
  };
}
