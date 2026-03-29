import { z } from "zod";

export const clientQuickSchema = z.object({
  prenom: z.string().min(1, "Prénom requis"),
  telephone: z.string().optional().nullable(),
});

export const clientFullSchema = z.object({
  prenom: z.string().min(1, "Prénom requis"),
  nom: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  dateNaissance: z.string().optional().nullable(),
  nationalite: z.string().optional().nullable(),
  numeroPiece: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  segment: z.enum(["STANDARD", "FREQUENT", "VIP", "PREMIUM"]).optional(),
});

export const clientCreateSchema = z.union([clientQuickSchema, clientFullSchema]);
export const clientUpdateSchema = clientFullSchema.partial();
