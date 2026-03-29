import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/auth-helpers";

const csvEscape = (value: string | number | null | undefined) => {
  const text = `${value ?? ""}`;
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

export async function GET() {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return gate.error;

  const factures = await prisma.facture.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "numero",
    "client",
    "statut",
    "montant_total",
    "montant_paye",
    "date_creation",
  ];

  const rows = factures.map((facture) => {
    const clientName = `${facture.client?.prenom ?? ""} ${
      facture.client?.nom ?? ""
    }`.trim();
    return [
      csvEscape(facture.numero),
      csvEscape(clientName),
      csvEscape(facture.statut),
      csvEscape(Number(facture.montantTotal)),
      csvEscape(Number(facture.montantPaye)),
      csvEscape(facture.createdAt.toISOString()),
    ].join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=factures.csv",
    },
  });
}
