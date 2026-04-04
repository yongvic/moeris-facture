import { z } from "zod";

export const factureCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  reservationId: z.string().optional().nullable(),
  evenementId: z.string().optional().nullable(),
  tauxTva: z
    .number()
    .min(0, "TVA invalide")
    .max(100, "TVA invalide")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  remiseGlobale: z.number().min(0, "Remise globale invalide").optional().nullable(),
  remisePourcent: z
    .number()
    .min(0, "Remise % invalide")
    .max(100, "Remise % maximale : 100")
    .optional()
    .nullable(),
});

export const factureUpdateSchema = z.object({
  statut: z
    .enum(["OUVERTE", "PARTIELLEMENT_PAYEE", "PAYEE", "ANNULEE"])
    .optional(),
  tauxTva: z
    .number()
    .min(0, "TVA invalide")
    .max(100, "TVA invalide")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  remiseGlobale: z.number().min(0, "Remise globale invalide").optional().nullable(),
  remisePourcent: z
    .number()
    .min(0, "Remise % invalide")
    .max(100, "Remise % maximale : 100")
    .optional()
    .nullable(),
});
