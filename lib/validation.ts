import { ZodError } from "zod";

export const zodErrorMessage = (
  error: ZodError,
  fallback = "Veuillez vérifier les champs requis."
) => error.issues[0]?.message ?? fallback;
