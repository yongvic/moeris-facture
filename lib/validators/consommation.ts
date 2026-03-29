import { z } from "zod";

export const consommationCreateSchema = z.object({
  factureId: z.string().min(1, "Facture requise"),
  categorie: z.enum(["CHAMBRE", "RESTAURANT", "ACTIVITE", "EVENEMENT", "DIVERS"]),
  description: z.string().min(1, "Description requise"),
  quantite: z.number().min(0.01, "Quantité invalide"),
  prixUnitaire: z.number().min(0, "Prix unitaire invalide"),
  remise: z.number().min(0, "Remise invalide").optional().nullable(),
  produitId: z.string().optional().nullable(),
  activiteId: z.string().optional().nullable(),
});

export const consommationUpdateSchema = consommationCreateSchema
  .omit({ factureId: true })
  .partial();
