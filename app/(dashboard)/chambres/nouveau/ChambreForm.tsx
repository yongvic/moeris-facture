"use client";

import { useActionState } from "react";
import { createChambre } from "../../actions/chambres";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function ChambreForm() {
  const [state, formAction] = useActionState(createChambre, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Numéro *
          <input
            name="numero"
            required
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Chambre 12"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom
          <input
            name="nom"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Suite Lac"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Type
          <select
            name="type"
            defaultValue="STANDARD"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="SUPERIEURE">SUPERIEURE</option>
            <option value="SUITE">SUITE</option>
            <option value="BUNGALOW">BUNGALOW</option>
            <option value="VILLA">VILLA</option>
            <option value="DUPLEX">DUPLEX</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Capacité
          <input
            name="capacite"
            type="number"
            min={1}
            defaultValue={2}
            inputMode="numeric"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix / nuit (XOF)
          <input
            name="prixNuit"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="Ex. 45000"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Équipements (séparés par des virgules)
        <input
          name="equipements"
          aria-describedby="equipements-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          placeholder="AC, WiFi, TV, Balcon"
        />
        <span id="equipements-help" className="text-xs text-[color:var(--ink-muted)]">
          Ex. WiFi, TV, Climatisation.
        </span>
      </label>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Description
        <textarea
          name="description"
          rows={3}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Photos de la chambre
        <input
          name="photos"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
        />
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Enregistrer la chambre"
        loadingLabel="Enregistrement..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}

