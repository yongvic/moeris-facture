"use client";

import { useFormState } from "react-dom";
import { createActivite } from "../../actions/activites";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function ActiviteForm() {
  const [state, formAction] = useFormState(createActivite, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom *
          <input
            name="nom"
            required
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Kayak, Spa, Tennis..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix (XOF) *
          <input
            name="prix"
            type="number"
            step="0.01"
            required
            min={0}
            inputMode="decimal"
            placeholder="Ex. 15000"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Unité
          <select
            name="prixParUnite"
            defaultValue="personne"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="personne">personne</option>
            <option value="heure">heure</option>
            <option value="session">session</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Capacité max
          <input
            name="capaciteMax"
            type="number"
            min={1}
            inputMode="numeric"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          <span className="flex items-center gap-2">
            <input type="checkbox" name="gratuit" aria-describedby="gratuit-help" />
            Gratuit
          </span>
          <span id="gratuit-help" className="text-xs text-[color:var(--ink-muted)]">
            Si gratuit, le prix sera fixé à 0.
          </span>
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
          Précisez l&apos;équipement ou les conditions.
        </span>
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Enregistrer l'activité"
        loadingLabel="Enregistrement..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
