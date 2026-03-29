import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export async function generateFactureNumero(client: PrismaLike = prisma) {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const lockKey = 910000 + year;
  await client.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

  const count = await client.facture.count({
    where: { createdAt: { gte: start, lt: end } },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `FAC-${year}-${seq}`;
}
