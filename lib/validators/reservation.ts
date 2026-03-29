import { z } from "zod";

export const reservationCreateSchema = z.object({
  clientId: z.string().min(1),
  chambreId: z.string().min(1),
  dateArrivee: z.string().min(1),
  dateDepart: z.string().min(1),
  nombreNuits: z.number().optional(),
  prixNegocie: z.number().optional().nullable(),
  nombreAdultes: z.number().min(1).default(1),
  nombreEnfants: z.number().min(0).default(0),
  statut: z
    .enum(["CONFIRMEE", "CHECK_IN_EFFECTUE", "CHECK_OUT_EFFECTUE", "ANNULEE", "NO_SHOW"])
    .optional(),
  notes: z.string().optional().nullable(),
});

export const reservationUpdateSchema = reservationCreateSchema.partial();
