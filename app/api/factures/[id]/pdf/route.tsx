import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { prisma } from "../../../../../lib/prisma";
import { requireRole } from "../../../../../lib/auth-helpers";

const formatXof = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: "#2B2418",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logo: { width: 120, height: 32, objectFit: "contain" },
  title: { fontSize: 16, fontWeight: "bold" },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: "#6B6256" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4D8C1",
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EFE6D6",
  },
  colCategory: { width: "20%" },
  colDesc: { width: "40%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totals: { alignSelf: "flex-end", marginTop: 12, width: "40%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;
  const { id } = await params;

  const facture = await prisma.facture.findUnique({
    where: { id },
    include: {
      client: true,
      consommations: { orderBy: { createdAt: "asc" } },
      paiements: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const logoPath = path.join(process.cwd(), "public", "logo_typo.png");
  const logoBuffer = await fs.readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const hotelName = process.env.HOTEL_NAME ?? "Residence Moeris";
  const hotelAddress = process.env.HOTEL_ADDRESS ?? "";
  const hotelPhone = process.env.HOTEL_PHONE ?? "";
  const hotelEmail = process.env.HOTEL_EMAIL ?? "";
  const hotelRegistry = process.env.HOTEL_REGISTRY ?? "";

  const total = Number(facture.montantTotal);
  const paid = Number(facture.montantPaye);
  const remaining = Math.max(0, total - paid);

  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoSrc} style={styles.logo} />
          <View>
            <Text style={styles.title}>Facture</Text>
            <Text style={styles.label}>{facture.numero}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text>{hotelName}</Text>
          <Text style={styles.label}>{hotelAddress}</Text>
          <Text style={styles.label}>{hotelPhone}</Text>
          <Text style={styles.label}>{hotelEmail}</Text>
          <Text style={styles.label}>Registre: {hotelRegistry}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Client</Text>
          <Text>
            {facture.client?.prenom} {facture.client?.nom ?? ""}
          </Text>
          <Text style={styles.label}>
            Date: {new Date(facture.createdAt).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCategory}>Catégorie</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colUnit}>PU</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {facture.consommations.map((item) => (
            <View style={styles.row} key={item.id}>
              <Text style={styles.colCategory}>{item.categorie}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{Number(item.quantite)}</Text>
              <Text style={styles.colUnit}>
                {formatXof(Number(item.prixUnitaire))}
              </Text>
              <Text style={styles.colTotal}>
                {formatXof(Number(item.sousTotal))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total</Text>
            <Text>{formatXof(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Payé</Text>
            <Text>{formatXof(paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Reste</Text>
            <Text>{formatXof(remaining)}</Text>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 16 }]}>
          <Text style={styles.label}>Historique des paiements</Text>
          {facture.paiements.length === 0 ? (
            <Text>Aucun paiement enregistré.</Text>
          ) : (
            facture.paiements.map((payment) => (
              <Text key={payment.id}>
                {payment.modePaiement} • {formatXof(Number(payment.montant))} •{" "}
                {new Date(payment.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            ))
          )}
        </View>
      </Page>
    </Document>
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${facture.numero}.pdf`,
    },
  });
}
