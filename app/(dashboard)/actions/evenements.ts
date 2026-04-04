"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { evenementCreateSchema, evenementUpdateSchema } from "../../../lib/validators/evenement";
import { z } from "zod";
import { zodErrorMessage } from "../../../lib/validation";
import { generateFactureNumero } from "../../../lib/invoice";
import { recalcFacture } from "../../../lib/billing";
import { createAuditLog } from "../../../lib/audit";
import { parseCsvFile, parseNullableString } from "../../../lib/csv";

type FormState = {
  error?: string;
  message?: string;
  values?: Record<string, string>;
};
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const normalize = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

const toNumber = (value: FormDataEntryValue | null) => {
  if (value === null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

async function resolveClientForEvenement(
  tx: TransactionClient,
  payload: { clientId?: string | null; prenom: string; nom: string; contact?: string | null }
) {
  if (payload.clientId) {
    const existingClient = await tx.client.findUnique({
      where: { id: payload.clientId },
      select: { id: true },
    });
    if (!existingClient) {
      throw new Error("Client introuvable.");
    }
    return existingClient.id;
  }

  if (payload.contact) {
    const byPhone = await tx.client.findFirst({
      where: { telephone: payload.contact },
      select: { id: true },
    });
    if (byPhone) return byPhone.id;
  }

  const byName = await tx.client.findFirst({
    where: {
      prenom: payload.prenom,
      nom: payload.nom,
    },
    select: { id: true },
  });
  if (byName) return byName.id;

  const createdClient = await tx.client.create({
    data: {
      prenom: payload.prenom,
      nom: payload.nom,
      telephone: payload.contact ?? null,
      segment: "STANDARD",
    },
  });

  return createdClient.id;
}

export async function createEvenement(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const values = {
    titre: formData.get("titre")?.toString() ?? "",
    type: formData.get("type")?.toString() ?? "SOIREE",
    description: formData.get("description")?.toString() ?? "",
    dateDebut: formData.get("dateDebut")?.toString() ?? "",
    dateFin: formData.get("dateFin")?.toString() ?? "",
    capaciteMax: formData.get("capaciteMax")?.toString() ?? "",
    prixParParticipant: formData.get("prixParParticipant")?.toString() ?? "",
    prixForfait: formData.get("prixForfait")?.toString() ?? "",
    acompteRequis: formData.get("acompteRequis")?.toString() ?? "",
    statut: formData.get("statut")?.toString() ?? "A_VENIR",
  };

  const payload = {
    titre: normalize(formData.get("titre")) ?? "",
    type: normalize(formData.get("type")) ?? "SOIREE",
    description: normalize(formData.get("description")),
    dateDebut: normalize(formData.get("dateDebut")) ?? "",
    dateFin: normalize(formData.get("dateFin")) ?? "",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    prixParParticipant: toNumber(formData.get("prixParParticipant")),
    prixForfait: toNumber(formData.get("prixForfait")),
    acompteRequis: toNumber(formData.get("acompteRequis")),
    statut: normalize(formData.get("statut")) ?? "A_VENIR",
  };

  const parsed = evenementCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error), values };
  }

  const dateDebut = new Date(parsed.data.dateDebut);
  const dateFin = new Date(parsed.data.dateFin);
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
    return { error: "Dates invalides.", values };
  }
  if (dateFin < dateDebut) {
    return { error: "La date de fin doit être après la date de début.", values };
  }

  const evenement = await prisma.evenement.create({
    data: {
      ...parsed.data,
      dateDebut,
      dateFin,
    },
  });

  revalidatePath("/evenements");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "EVENEMENT_CREATED",
    entityType: "Evenement",
    entityId: evenement.id,
  });
  redirect(`/evenements/${evenement.id}`);
}

export async function updateEvenement(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Événement introuvable." };

  const values = {
    titre: formData.get("titre")?.toString() ?? "",
    type: formData.get("type")?.toString() ?? "SOIREE",
    description: formData.get("description")?.toString() ?? "",
    dateDebut: formData.get("dateDebut")?.toString() ?? "",
    dateFin: formData.get("dateFin")?.toString() ?? "",
    capaciteMax: formData.get("capaciteMax")?.toString() ?? "",
    prixParParticipant: formData.get("prixParParticipant")?.toString() ?? "",
    prixForfait: formData.get("prixForfait")?.toString() ?? "",
    acompteRequis: formData.get("acompteRequis")?.toString() ?? "",
    statut: formData.get("statut")?.toString() ?? "",
  };

  const payload = {
    titre: normalize(formData.get("titre")) ?? "",
    type: normalize(formData.get("type")) ?? "SOIREE",
    description: normalize(formData.get("description")),
    dateDebut: normalize(formData.get("dateDebut")) ?? "",
    dateFin: normalize(formData.get("dateFin")) ?? "",
    capaciteMax: toNumber(formData.get("capaciteMax")),
    prixParParticipant: toNumber(formData.get("prixParParticipant")),
    prixForfait: toNumber(formData.get("prixForfait")),
    acompteRequis: toNumber(formData.get("acompteRequis")),
    statut: normalize(formData.get("statut")) ?? undefined,
  };

  const parsed = evenementUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: zodErrorMessage(parsed.error), values };
  }

  if (parsed.data.dateDebut || parsed.data.dateFin) {
    const dateDebut = parsed.data.dateDebut
      ? new Date(parsed.data.dateDebut)
      : undefined;
    const dateFin = parsed.data.dateFin ? new Date(parsed.data.dateFin) : undefined;
    if (
      (dateDebut && Number.isNaN(dateDebut.getTime())) ||
      (dateFin && Number.isNaN(dateFin.getTime()))
    ) {
      return { error: "Dates invalides.", values };
    }
    if (dateDebut && dateFin && dateFin < dateDebut) {
      return { error: "La date de fin doit être après la date de début.", values };
    }
  }

  await prisma.evenement.update({
    where: { id },
    data: {
      ...parsed.data,
      dateDebut: parsed.data.dateDebut
        ? new Date(parsed.data.dateDebut)
        : undefined,
      dateFin: parsed.data.dateFin ? new Date(parsed.data.dateFin) : undefined,
    },
  });

  revalidatePath(`/evenements/${id}`);
  revalidatePath("/evenements");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "EVENEMENT_UPDATED",
    entityType: "Evenement",
    entityId: id,
  });
  return {};
}

const participantSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  contact: z.string().optional().nullable(),
  acomptePaye: z.number().min(0, "Acompte invalide").optional().nullable(),
  clientId: z.string().optional().nullable(),
});

export async function addParticipant(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("STAFF");
  if ("error" in gate) return { error: "Non autorisé." };

  const evenementId = formData.get("evenementId")?.toString();
  if (!evenementId) return { error: "Événement introuvable." };

  const values = {
    prenom: formData.get("prenom")?.toString() ?? "",
    nom: formData.get("nom")?.toString() ?? "",
    contact: formData.get("contact")?.toString() ?? "",
    acomptePaye: formData.get("acomptePaye")?.toString() ?? "",
    clientId: formData.get("clientId")?.toString() ?? "",
  };

  const rawPayload = {
    nom: normalize(formData.get("nom")) ?? "",
    prenom: normalize(formData.get("prenom")) ?? "",
    contact: normalize(formData.get("contact")),
    acomptePaye: toNumber(formData.get("acomptePaye")),
    clientId: normalize(formData.get("clientId")),
  };

  let payload = rawPayload;
  if (rawPayload.clientId) {
    const existingClient = await prisma.client.findUnique({
      where: { id: rawPayload.clientId },
      select: { prenom: true, nom: true, telephone: true },
    });
    if (!existingClient) {
      return { error: "Client introuvable.", values };
    }

    payload = {
      ...rawPayload,
      prenom: existingClient.prenom,
      nom: existingClient.nom ?? (rawPayload.nom || existingClient.prenom),
      contact: existingClient.telephone ?? rawPayload.contact,
    };
  }

  const parsed = participantSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: zodErrorMessage(parsed.error, "Participant invalide."),
      values,
    };
  }

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    select: {
      id: true,
      titre: true,
      capaciteMax: true,
      prixParParticipant: true,
      prixForfait: true,
      acompteRequis: true,
      _count: { select: { participants: true } },
    },
  });

  if (!evenement) return { error: "Événement introuvable." };
  if (
    evenement.capaciteMax &&
    evenement._count.participants >= evenement.capaciteMax
  ) {
    return { error: "Capacité maximale atteinte.", values };
  }

  const acomptePaye = parsed.data.acomptePaye ?? null;
  const prixParParticipant = evenement.prixParParticipant
    ? Number(evenement.prixParParticipant)
    : 0;
  const prixForfait = evenement.prixForfait ? Number(evenement.prixForfait) : 0;

  if (
    acomptePaye !== null &&
    evenement.acompteRequis &&
    acomptePaye < Number(evenement.acompteRequis)
  ) {
    return { error: "L'acompte saisi est inférieur à l'acompte requis.", values };
  }

  if (acomptePaye !== null && prixParParticipant > 0 && acomptePaye > prixParParticipant) {
    return { error: "L'acompte ne peut pas dépasser le prix participant.", values };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const resolvedClientId =
        prixParParticipant > 0 || prixForfait > 0
          ? await resolveClientForEvenement(tx, {
              clientId: parsed.data.clientId ?? null,
              prenom: parsed.data.prenom,
              nom: parsed.data.nom,
              contact: parsed.data.contact ?? null,
            })
          : null;

      const participant = await tx.participantEvenement.create({
        data: {
          evenementId,
          nom: parsed.data.nom,
          prenom: parsed.data.prenom,
          contact: parsed.data.contact ?? null,
          statut: "INSCRIT",
          acomptePaye,
          soldeRestant:
            prixParParticipant > 0
              ? Math.max(0, prixParParticipant - (acomptePaye ?? 0))
              : null,
        },
      });

      if (prixParParticipant > 0) {
        const numero = await generateFactureNumero(tx);
        const facture = await tx.facture.create({
          data: {
            numero,
            clientId: resolvedClientId!,
            evenementId,
            participantId: participant.id,
            notes: `Participant événement: ${evenement.titre}`,
          },
        });

        await tx.consommation.create({
          data: {
            factureId: facture.id,
            categorie: "EVENEMENT",
            description: `Participation - ${evenement.titre}`,
            quantite: 1,
            prixUnitaire: prixParParticipant,
            sousTotal: prixParParticipant,
          },
        });
        await recalcFacture(facture.id, tx);

        if (acomptePaye && acomptePaye > 0) {
          await tx.paiement.create({
            data: {
              factureId: facture.id,
              montant: acomptePaye,
              modePaiement: "ESPECES",
              note: "Acompte événement",
              encaisseePar: gate.session.user?.name ?? null,
            },
          });
          await recalcFacture(facture.id, tx);
        }
      }

      if (prixParParticipant <= 0 && prixForfait > 0 && resolvedClientId) {
        let facture = await tx.facture.findFirst({
          where: {
            evenementId,
            clientId: resolvedClientId,
            participantId: null,
            statut: { not: "ANNULEE" },
          },
          select: { id: true },
        });

        if (!facture) {
          const numero = await generateFactureNumero(tx);
          facture = await tx.facture.create({
            data: {
              numero,
              clientId: resolvedClientId,
              evenementId,
              notes: `Forfait événement: ${evenement.titre}`,
            },
            select: { id: true },
          });
        }

        const existingForfait = await tx.consommation.findFirst({
          where: {
            factureId: facture.id,
            categorie: "EVENEMENT",
            description: `Forfait événement - ${evenement.titre}`,
            supprimee: false,
          },
          select: { id: true },
        });

        if (!existingForfait) {
          await tx.consommation.create({
            data: {
              factureId: facture.id,
              categorie: "EVENEMENT",
              description: `Forfait événement - ${evenement.titre}`,
              quantite: 1,
              prixUnitaire: prixForfait,
              sousTotal: prixForfait,
            },
          });
        }

        await recalcFacture(facture.id, tx);

        if (acomptePaye && acomptePaye > 0) {
          await tx.paiement.create({
            data: {
              factureId: facture.id,
              montant: acomptePaye,
              modePaiement: "ESPECES",
              note: `Acompte événement - ${parsed.data.prenom} ${parsed.data.nom}`,
              encaisseePar: gate.session.user?.name ?? null,
            },
          });
          await recalcFacture(facture.id, tx);
        }
      }

      await createAuditLog(
        {
          actorId: gate.session.user?.id ?? null,
          action: "EVENEMENT_PARTICIPANT_ADDED",
          entityType: "Evenement",
          entityId: evenementId,
          details: {
            prenom: parsed.data.prenom,
            nom: parsed.data.nom,
            acomptePaye,
            clientId: resolvedClientId,
          },
        },
        tx
      );
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d'ajouter le participant.",
      values,
    };
  }

  revalidatePath(`/evenements/${evenementId}`);
  return {};
}

export async function importEvenementsCsv(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const gate = await requireRole("MANAGER");
  if ("error" in gate) return { error: "Non autorisé." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Fichier CSV requis." };
  }

  let rows;
  try {
    rows = await parseCsvFile(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "CSV illisible." };
  }

  let imported = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const payload = {
      titre: parseNullableString(row.titre) ?? "",
      type: parseNullableString(row.type) ?? "SOIREE",
      description: parseNullableString(row.description),
      dateDebut: parseNullableString(row.dateDebut) ?? "",
      dateFin: parseNullableString(row.dateFin) ?? "",
      capaciteMax: row.capaciteMax ? Number(row.capaciteMax) : null,
      prixParParticipant: row.prixParParticipant
        ? Number(row.prixParParticipant)
        : null,
      prixForfait: row.prixForfait ? Number(row.prixForfait) : null,
      acompteRequis: row.acompteRequis ? Number(row.acompteRequis) : null,
      statut: parseNullableString(row.statut) ?? "A_VENIR",
    };

    const parsed = evenementCreateSchema.safeParse(payload);
    if (!parsed.success) {
      errors.push(`Ligne ${index + 2}: ${zodErrorMessage(parsed.error)}`);
      continue;
    }

    const dateDebut = new Date(parsed.data.dateDebut);
    const dateFin = new Date(parsed.data.dateFin);
    if (
      Number.isNaN(dateDebut.getTime()) ||
      Number.isNaN(dateFin.getTime()) ||
      dateFin < dateDebut
    ) {
      errors.push(`Ligne ${index + 2}: dates invalides.`);
      continue;
    }

    try {
      await prisma.evenement.create({
        data: {
          ...parsed.data,
          dateDebut,
          dateFin,
        },
      });
      imported += 1;
    } catch {
      errors.push(`Ligne ${index + 2}: échec d'import.`);
    }
  }

  revalidatePath("/evenements");
  await createAuditLog({
    actorId: gate.session.user?.id ?? null,
    action: "EVENEMENTS_IMPORTED",
    entityType: "Evenement",
    details: { imported, errors: errors.length },
  });

  if (imported === 0) {
    return { error: errors[0] ?? "Aucun événement importé." };
  }

  return {
    message:
      errors.length > 0
        ? `${imported} événements importés, ${errors.length} lignes ignorées.`
        : `${imported} événements importés.`,
  };
}
