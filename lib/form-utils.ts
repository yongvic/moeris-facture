// lib/form-utils.ts
// Utilitaires partagés pour la lecture des FormData dans les Server Actions.
// Centralise la logique dupliquée dans tous les fichiers d'actions.

/**
 * Retourne null si la valeur est nulle ou une chaîne vide après trim.
 * Sinon retourne la chaîne nettoyée.
 */
export const normalize = (value: FormDataEntryValue | null): string | null => {
  if (value === null) return null;
  const text = value.toString().trim();
  return text.length === 0 ? null : text;
};

/**
 * Convertit une valeur FormData en nombre.
 * Retourne null si la valeur est nulle ou n'est pas un nombre valide.
 */
export const toNumber = (value: FormDataEntryValue | null): number | null => {
  if (value === null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

/**
 * Convertit une valeur FormData en tableau de strings (séparés par virgule).
 */
export const toArray = (value: FormDataEntryValue | null): string[] => {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
