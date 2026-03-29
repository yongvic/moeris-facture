import { z } from "zod";

export const factureCreateSchema = z.object({
  clientId: z.string().min(1),
  reservationId: z.string().optional().nullable(),
  evenementId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  remiseGlobale: z.number().optional().nullable(),
  remisePourcent: z.number().optional().nullable(),
});

export const factureUpdateSchema = z.object({
  statut: z
    .enum(["OUVERTE", "PARTIELLEMENT_PAYEE", "PAYEE", "ANNULEE"])
    .optional(),
  notes: z.string().optional().nullable(),
  remiseGlobale: z.number().optional().nullable(),
  remisePourcent: z.number().optional().nullable(),
});
