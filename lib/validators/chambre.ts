import { z } from "zod";

export const chambreCreateSchema = z.object({
  numero: z.string().min(1),
  nom: z.string().optional().nullable(),
  type: z.enum(["STANDARD", "SUPERIEURE", "SUITE", "BUNGALOW", "VILLA", "DUPLEX"]),
  capacite: z.number().min(1),
  prixNuit: z.number().min(0),
  description: z.string().optional().nullable(),
  equipements: z.array(z.string()).default([]),
  statut: z
    .enum(["DISPONIBLE", "OCCUPEE", "MAINTENANCE", "HORS_SERVICE"])
    .optional(),
  etage: z.number().optional().nullable(),
});

export const chambreUpdateSchema = chambreCreateSchema.partial();
