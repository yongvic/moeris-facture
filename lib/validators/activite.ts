import { z } from "zod";

export const activiteCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  prix: z.number().min(0, "Prix invalide"),
  prixParUnite: z.string().optional(),
  gratuit: z.boolean().optional(),
  capaciteMax: z.number().min(1, "Capacité invalide").optional().nullable(),
  disponible: z.boolean().optional(),
});

export const activiteUpdateSchema = activiteCreateSchema.partial();
