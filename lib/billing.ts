import { prisma } from "./prisma";

type PrismaLike = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export async function recalcFacture(
  factureId: string,
  client: PrismaLike = prisma
) {
  const facture = await client.facture.findUnique({
    where: { id: factureId },
    select: {
      tauxTva: true,
      remiseGlobale: true,
      remisePourcent: true,
    },
  });

  if (!facture) {
    throw new Error("Facture introuvable.");
  }

  const total = await client.consommation.aggregate({
    where: { factureId, supprimee: false },
    _sum: { sousTotal: true },
  });

  const paid = await client.paiement.aggregate({
    where: { factureId },
    _sum: { montant: true },
  });

  const grossHt = total._sum.sousTotal ? Number(total._sum.sousTotal) : 0;
  const remiseGlobale = facture.remiseGlobale ? Number(facture.remiseGlobale) : 0;
  const remisePourcent = facture.remisePourcent
    ? Number(facture.remisePourcent)
    : 0;
  const remisePourcentValue = roundCurrency((grossHt * remisePourcent) / 100);
  const remiseTotale = Math.min(
    grossHt,
    roundCurrency(remiseGlobale + remisePourcentValue)
  );
  const htValue = roundCurrency(Math.max(0, grossHt - remiseTotale));
  const tauxTva = Number(facture.tauxTva ?? 0);
  const taxValue = roundCurrency((htValue * tauxTva) / 100);
  const totalValue = roundCurrency(htValue + taxValue);
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
      montantHt: htValue,
      montantTva: taxValue,
      montantTotal: totalValue,
      montantPaye: paidValue,
      statut,
      clotureeAt: statut === "PAYEE" ? new Date() : null,
    },
  });

  return { htValue, taxValue, totalValue, paidValue, statut, tauxTva };
}
