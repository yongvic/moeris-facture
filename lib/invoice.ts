import { prisma } from "./prisma";

export async function generateFactureNumero() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const count = await prisma.facture.count({
    where: { createdAt: { gte: start, lt: end } },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `FAC-${year}-${seq}`;
}
