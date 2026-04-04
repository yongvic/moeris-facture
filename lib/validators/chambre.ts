import { z } from "zod";

export const chambreCreateSchema = z.object({
  numero: z.string().min(1, "Numéro de chambre requis"),
  nom: z.string().optional().nullable(),
  type: z.enum(["STANDARD", "SUPERIEURE", "SUITE", "BUNGALOW", "VILLA", "DUPLEX"]),
  capacite: z.number().min(1, "Capacité minimale : 1"),
  prixNuit: z.number().min(0, "Prix par nuit invalide"),
  description: z.string().optional().nullable(),
  equipements: z.array(z.string()).default([]),
  photoUrls: z.array(z.string()).default([]),
  statut: z
    .enum(["DISPONIBLE", "RESERVEE", "OCCUPEE", "MAINTENANCE", "HORS_SERVICE"])
    .optional(),
  etage: z.number().min(0, "Étage invalide").optional().nullable(),
});

export const chambreUpdateSchema = chambreCreateSchema.partial();
