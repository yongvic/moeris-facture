import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function normalizeConnectionString(connectionString: string | undefined) {
  if (!connectionString) return connectionString;

  const normalized = new URL(connectionString);
  const sslmode = normalized.searchParams.get("sslmode");

  if (!sslmode || ["prefer", "require", "verify-ca"].includes(sslmode)) {
    normalized.searchParams.set("sslmode", "verify-full");
  }

  return normalized.toString();
}

const connectionString = normalizeConnectionString(process.env.DATABASE_URL);

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
