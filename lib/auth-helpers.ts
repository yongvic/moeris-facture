import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

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

  return { session, role };
}
