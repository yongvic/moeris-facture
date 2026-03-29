import { z } from "zod";

export const produitCreateSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional().nullable(),
  prix: z.number().min(0),
  categorie: z.string().min(1),
  disponible: z.boolean().optional(),
  archive: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const produitUpdateSchema = produitCreateSchema.partial();
