"use client";

import { useFormState } from "react-dom";
import { updateProduit } from "../../../actions/produits";
import FormError from "../../../../components/FormError";
import SubmitButton from "../../../../components/SubmitButton";

const initialState = { error: "" };

type ProduitData = {
  id: string;
  nom: string;
  description?: string | null;
  prix: number;
  categorie: string;
  disponible: boolean;
  archive: boolean;
};

export default function ProduitEditForm({ produit }: { produit: ProduitData }) {
  const [state, formAction] = useFormState(updateProduit, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={produit.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom *
          <input
            name="nom"
            required
            defaultValue={produit.nom}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Poulet braisé"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Catégorie *
          <input
            name="categorie"
            required
            defaultValue={produit.categorie}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
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
            defaultValue={Number(produit.prix)}
            min={0}
            inputMode="decimal"
            placeholder="Ex. 5500"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <div className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="disponible"
              defaultChecked={produit.disponible}
            />
            Disponible
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="archive" defaultChecked={produit.archive} />
            Archivé
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={produit.description ?? ""}
          aria-describedby="description-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="description-help" className="text-xs text-[color:var(--ink-muted)]">
          Ajoutez les ingrédients ou allergènes importants.
        </span>
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Mettre à jour"
        loadingLabel="Mise à jour..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
