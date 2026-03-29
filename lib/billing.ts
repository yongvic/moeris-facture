import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export async function recalcFacture(
  factureId: string,
  client: PrismaLike = prisma
) {
  const total = await client.consommation.aggregate({
    where: { factureId, supprimee: false },
    _sum: { sousTotal: true },
  });

  const paid = await client.paiement.aggregate({
    where: { factureId },
    _sum: { montant: true },
  });

  const totalValue = total._sum.sousTotal ? Number(total._sum.sousTotal) : 0;
  const paidValue = paid._sum.montant ? Number(paid._sum.montant) : 0;

  let statut: "OUVERTE" | "PARTIELLEMENT_PAYEE" | "PAYEE" = "OUVERTE";
  if (paidValue > 0 && paidValue < totalValue) {
    statut = "PARTIELLEMENT_PAYEE";
  }
  if (totalValue > 0 && paidValue >= totalValue) {
    statut = "PAYEE";
  }

  await client.facture.update({
    where: { id: factureId },
    data: {
      montantTotal: totalValue,
      montantPaye: paidValue,
      statut,
      clotureeAt: statut === "PAYEE" ? new Date() : null,
    },
  });

  return { totalValue, paidValue, statut };
}
