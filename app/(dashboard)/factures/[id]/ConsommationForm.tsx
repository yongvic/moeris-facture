"use client";

import { useFormState } from "react-dom";
import { addConsommation } from "../../actions/factures";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function ConsommationForm({ factureId }: { factureId: string }) {
  const [state, formAction] = useFormState(addConsommation, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input type="hidden" name="factureId" value={factureId} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Catégorie
          <select
            name="categorie"
            defaultValue="DIVERS"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="CHAMBRE">CHAMBRE</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="ACTIVITE">ACTIVITE</option>
            <option value="EVENEMENT">EVENEMENT</option>
            <option value="DIVERS">DIVERS</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Description *
          <input
            name="description"
            required
            placeholder="Ex. Nuitée chambre 12"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Quantité
          <input
            name="quantite"
            type="number"
            step="0.1"
            min={0.01}
            defaultValue={1}
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix unitaire (XOF) *
          <input
            name="prixUnitaire"
            type="number"
            step="0.01"
            min={0}
            required
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Remise (XOF)
          <input
            name="remise"
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            aria-describedby="remise-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <span id="remise-help" className="text-xs text-[color:var(--ink-muted)]">
            Laissez vide si aucune remise ne s&apos;applique.
          </span>
        </label>
      </div>

      <FormError message={state.error} />

      <SubmitButton
        label="Ajouter la consommation"
        loadingLabel="Ajout..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
