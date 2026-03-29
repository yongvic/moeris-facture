import { z } from "zod";

export const reservationCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  chambreId: z.string().min(1, "Chambre requise"),
  dateArrivee: z.string().min(1, "Date d'arrivée requise"),
  dateDepart: z.string().min(1, "Date de départ requise"),
  nombreNuits: z.number().min(1, "Nombre de nuits invalide").optional(),
  prixNegocie: z.number().min(0, "Prix négocié invalide").optional().nullable(),
  nombreAdultes: z.number().min(1, "Au moins 1 adulte").default(1),
  nombreEnfants: z.number().min(0, "Nombre d'enfants invalide").default(0),
  statut: z
    .enum(["CONFIRMEE", "CHECK_IN_EFFECTUE", "CHECK_OUT_EFFECTUE", "ANNULEE", "NO_SHOW"])
    .optional(),
  notes: z.string().optional().nullable(),
});

export const reservationUpdateSchema = reservationCreateSchema.partial();
