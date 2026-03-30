import { prisma } from "./prisma";

type PrismaLike = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function generateFactureNumero(client: PrismaLike = prisma) {
  const now = new Date();
  const year = now.getFullYear();

  const lockKey = 910000 + year;
  await client.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

  const lastFacture = await client.facture.findFirst({
    where: {
      numero: {
        startsWith: `FAC-${year}-`,
      },
    },
    orderBy: {
      numero: "desc",
    },
    select: {
      numero: true,
    },
  });

  let nextSeq = 1;
  if (lastFacture) {
    const parts = lastFacture.numero.split("-");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seq = String(nextSeq).padStart(4, "0");
  return `FAC-${year}-${seq}`;
}
