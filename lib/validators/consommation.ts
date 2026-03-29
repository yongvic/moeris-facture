import { z } from "zod";

export const consommationCreateSchema = z.object({
  factureId: z.string().min(1),
  categorie: z.enum(["CHAMBRE", "RESTAURANT", "ACTIVITE", "EVENEMENT", "DIVERS"]),
  description: z.string().min(1),
  quantite: z.number().min(0.01),
  prixUnitaire: z.number().min(0),
  remise: z.number().min(0).optional().nullable(),
  produitId: z.string().optional().nullable(),
  activiteId: z.string().optional().nullable(),
});

export const consommationUpdateSchema = consommationCreateSchema
  .omit({ factureId: true })
  .partial();
