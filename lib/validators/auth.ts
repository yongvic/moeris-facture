import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe est trop long.");

export const registerSchema = z.object({
  prenom: z.string().min(1, "Prénom requis.").max(80, "Prénom trop long."),
  nom: z.string().min(1, "Nom requis.").max(80, "Nom trop long."),
  email: z.string().email("Email invalide.").max(190, "Email trop long."),
  password: passwordRule,
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Email invalide.").max(190, "Email trop long."),
});

export const passwordResetSchema = z.object({
  token: z.string().min(16, "Jeton invalide."),
  password: passwordRule,
});
