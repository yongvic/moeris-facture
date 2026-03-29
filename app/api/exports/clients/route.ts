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

  const clients = await prisma.client.findMany({
    where: { actif: true },
    include: {
      factures: {
        select: { montantTotal: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "prenom",
    "nom",
    "email",
    "telephone",
    "segment",
    "total_depenses",
    "derniere_visite",
  ];

  const rows = clients.map((client) => {
    const total = client.factures.reduce(
      (acc, facture) => acc + Number(facture.montantTotal ?? 0),
      0
    );
    const lastVisit = client.factures[0]?.createdAt ?? client.createdAt;
    return [
      csvEscape(client.prenom),
      csvEscape(client.nom),
      csvEscape(client.email),
      csvEscape(client.telephone),
      csvEscape(client.segment),
      csvEscape(total),
      csvEscape(lastVisit.toISOString()),
    ].join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=clients.csv",
    },
  });
}
