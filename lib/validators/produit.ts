import { z } from "zod";

export const produitCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  prix: z.number().min(0, "Prix invalide"),
  categorie: z.string().min(1, "Catégorie requise"),
  disponible: z.boolean().optional(),
  archive: z.boolean().optional(),
  imageUrl: z.string().url("URL invalide").optional().nullable(),
});

export const produitUpdateSchema = produitCreateSchema.partial();
