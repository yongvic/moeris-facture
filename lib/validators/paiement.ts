import { z } from "zod";

export const paiementCreateSchema = z.object({
  factureId: z.string().min(1, "Facture requise"),
  montant: z.number().min(0.01, "Montant invalide"),
  modePaiement: z.enum([
    "ESPECES",
    "VIREMENT",
    "MOBILE_MONEY",
    "CARTE_BANCAIRE",
    "CHEQUE",
    "AUTRE",
  ]),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});
