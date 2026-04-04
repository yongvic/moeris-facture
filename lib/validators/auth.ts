import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe est trop long.")
  .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule.")
  .regex(/\d/, "Le mot de passe doit contenir un chiffre.")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir un caractère spécial.");

const roleRule = z.enum(["ADMIN", "MANAGER", "STAFF"]);

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

export const adminUserCreateSchema = z.object({
  prenom: z.string().min(1, "Prénom requis.").max(80, "Prénom trop long."),
  nom: z.string().min(1, "Nom requis.").max(80, "Nom trop long."),
  email: z.string().email("Email invalide.").max(190, "Email trop long."),
  password: passwordRule,
  role: roleRule,
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().min(1, "Utilisateur requis."),
  role: roleRule.optional(),
  actif: z.boolean().optional(),
});
