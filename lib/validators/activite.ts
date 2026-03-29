import { z } from "zod";

export const activiteCreateSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional().nullable(),
  prix: z.number().min(0),
  prixParUnite: z.string().optional(),
  gratuit: z.boolean().optional(),
  capaciteMax: z.number().optional().nullable(),
  disponible: z.boolean().optional(),
});

export const activiteUpdateSchema = activiteCreateSchema.partial();
