import { z } from "zod";

export const evenementCreateSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  type: z.enum([
    "SOIREE",
    "SEMINAIRE",
    "MARIAGE",
    "ANNIVERSAIRE",
    "CONFERENCE",
    "AUTRE",
  ]),
  description: z.string().optional().nullable(),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  capaciteMax: z.number().min(1, "Capacité invalide").optional().nullable(),
  prixParParticipant: z.number().min(0, "Prix invalide").optional().nullable(),
  prixForfait: z.number().min(0, "Prix invalide").optional().nullable(),
  acompteRequis: z.number().min(0, "Acompte invalide").optional().nullable(),
  statut: z.enum(["A_VENIR", "EN_COURS", "TERMINE", "ANNULE"]).optional(),
});

export const evenementUpdateSchema = evenementCreateSchema.partial();
