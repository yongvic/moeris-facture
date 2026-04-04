import { NextResponse } from "next/server";
import { StatutFacture } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { factureCreateSchema } from "../../../lib/validators/facture";
import { generateFactureNumero } from "../../../lib/invoice";
import { recalcFacture } from "../../../lib/billing";

const defaultTvaRate = Number(process.env.DEFAULT_TVA_RATE ?? 18);

export async function GET(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(request.url);
  const statutParam = searchParams.get("statut") ?? undefined;
  const statut =
    statutParam && (Object.values(StatutFacture) as string[]).includes(statutParam)
      ? (statutParam as StatutFacture)
      : undefined;
  const clientId = searchParams.get("clientId") ?? undefined;
  const take = Number(searchParams.get("take") ?? 50);
  const skip = Number(searchParams.get("skip") ?? 0);

  const factures = await prisma.facture.findMany({
    where: {
      statut,
      clientId: clientId ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    include: {
      client: true,
      paiements: true,
    },
  });

  return NextResponse.json({ data: factures });
}

export async function POST(request: Request) {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return gate.error;

  const payload = await request.json();
  const parsed = factureCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  if (parsed.data.reservationId && parsed.data.evenementId) {
    return NextResponse.json(
      { error: "Une facture ne peut pas être liée à une réservation et un événement en même temps." },
      { status: 400 }
    );
  }

  try {
    const facture = await prisma.$transaction(async (tx) => {
    let reservationData:
      | {
          clientId: string;
          nombreNuits: number;
          prixNegocie: number | null;
          chambre: { numero: string; nom: string | null; prixNuit: number };
        }
      | null = null;
    let evenementData:
      | {
          titre: string;
          prixForfait: number | null;
        }
      | null = null;

    if (parsed.data.reservationId) {
      const reservation = await tx.reservation.findUnique({
        where: { id: parsed.data.reservationId },
        select: {
          clientId: true,
          nombreNuits: true,
          prixNegocie: true,
          chambre: {
            select: { numero: true, nom: true, prixNuit: true },
          },
        },
      });
      if (!reservation) {
        throw new Error("Réservation introuvable.");
      }
      if (reservation.clientId !== parsed.data.clientId) {
        throw new Error("Le client sélectionné ne correspond pas à la réservation.");
      }
      reservationData = {
        ...reservation,
        prixNegocie: reservation.prixNegocie ? Number(reservation.prixNegocie) : null,
        chambre: {
          ...reservation.chambre,
          prixNuit: Number(reservation.chambre.prixNuit),
        },
      };
    }

    if (parsed.data.evenementId) {
      const evenement = await tx.evenement.findUnique({
        where: { id: parsed.data.evenementId },
        select: { titre: true, prixForfait: true },
      });
      if (!evenement) {
        throw new Error("Événement introuvable.");
      }
      evenementData = {
        titre: evenement.titre,
        prixForfait: evenement.prixForfait ? Number(evenement.prixForfait) : null,
      };
    }

    const numero = await generateFactureNumero(tx);
    const createdFacture = await tx.facture.create({
      data: {
        numero,
        clientId: parsed.data.clientId,
        reservationId: parsed.data.reservationId ?? null,
        evenementId: parsed.data.evenementId ?? null,
        tauxTva: parsed.data.tauxTva ?? defaultTvaRate,
        notes: parsed.data.notes ?? null,
        remiseGlobale: parsed.data.remiseGlobale ?? null,
        remisePourcent: parsed.data.remisePourcent ?? null,
      },
    });

    if (reservationData) {
      const prixNuit = reservationData.prixNegocie ?? reservationData.chambre.prixNuit;
      await tx.consommation.create({
        data: {
          factureId: createdFacture.id,
          categorie: "CHAMBRE",
          description: `Séjour ${reservationData.chambre.nom ?? reservationData.chambre.numero} (${reservationData.nombreNuits} nuit(s))`,
          quantite: reservationData.nombreNuits,
          prixUnitaire: prixNuit,
          sousTotal: reservationData.nombreNuits * prixNuit,
        },
      });
    }

    if (evenementData?.prixForfait && evenementData.prixForfait > 0) {
      await tx.consommation.create({
        data: {
          factureId: createdFacture.id,
          categorie: "EVENEMENT",
          description: `Forfait événement - ${evenementData.titre}`,
          quantite: 1,
          prixUnitaire: evenementData.prixForfait,
          sousTotal: evenementData.prixForfait,
        },
      });
    }

    await recalcFacture(createdFacture.id, tx);
    return createdFacture;
    });

    return NextResponse.json({ data: facture }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de créer la facture." },
      { status: 400 }
    );
  }
}
