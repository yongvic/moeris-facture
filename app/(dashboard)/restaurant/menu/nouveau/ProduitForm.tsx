"use client";

import { useFormState } from "react-dom";
import { createProduit } from "../../../actions/produits";
import FormError from "../../../../components/FormError";
import SubmitButton from "../../../../components/SubmitButton";

const initialState = { error: "" };

export default function ProduitForm() {
  const [state, formAction] = useFormState(createProduit, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom *
          <input
            name="nom"
            required
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Poulet braisé"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Catégorie *
          <input
            name="categorie"
            required
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Plat, Boisson..."
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix (XOF) *
          <input
            name="prix"
            type="number"
            step="0.01"
            required
            min={0}
            inputMode="decimal"
            placeholder="Ex. 5500"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Disponible
          <input type="checkbox" name="disponible" defaultChecked />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Description
        <textarea
          name="description"
          rows={3}
          aria-describedby="description-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="description-help" className="text-xs text-[color:var(--ink-muted)]">
          Ajoutez les ingrédients ou allergènes importants.
        </span>
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Enregistrer le produit"
        loadingLabel="Enregistrement..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
