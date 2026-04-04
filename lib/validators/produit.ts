import { z } from "zod";

const imageUrlSchema = z
  .string()
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "URL d'image invalide"
  );

export const produitCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  prix: z.number().min(0, "Prix invalide"),
  categorie: z.string().min(1, "Catégorie requise"),
  disponible: z.boolean().optional(),
  archive: z.boolean().optional(),
  imageUrl: imageUrlSchema.optional().nullable(),
});

export const produitUpdateSchema = produitCreateSchema.partial();
