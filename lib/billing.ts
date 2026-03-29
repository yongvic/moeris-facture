import { prisma } from "./prisma";

export async function recalcFacture(factureId: string) {
  const total = await prisma.consommation.aggregate({
    where: { factureId, supprimee: false },
    _sum: { sousTotal: true },
  });

  const paid = await prisma.paiement.aggregate({
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

  await prisma.facture.update({
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
