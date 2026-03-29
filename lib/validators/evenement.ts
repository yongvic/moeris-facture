import { z } from "zod";

export const evenementCreateSchema = z.object({
  titre: z.string().min(1),
  type: z.enum([
    "SOIREE",
    "SEMINAIRE",
    "MARIAGE",
    "ANNIVERSAIRE",
    "CONFERENCE",
    "AUTRE",
  ]),
  description: z.string().optional().nullable(),
  dateDebut: z.string().min(1),
  dateFin: z.string().min(1),
  capaciteMax: z.number().optional().nullable(),
  prixParParticipant: z.number().optional().nullable(),
  prixForfait: z.number().optional().nullable(),
  acompteRequis: z.number().optional().nullable(),
  statut: z.enum(["A_VENIR", "EN_COURS", "TERMINE", "ANNULE"]).optional(),
});

export const evenementUpdateSchema = evenementCreateSchema.partial();
