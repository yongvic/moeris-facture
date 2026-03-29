"use client";

import { useActionState } from "react";
import { updateChambre } from "../../actions/chambres";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type ChambreData = {
  id: string;
  numero: string;
  nom?: string | null;
  type: string;
  capacite: number;
  prixNuit: number;
  description?: string | null;
  equipements: string[];
  statut: string;
  etage?: number | null;
};

export default function ChambreEditForm({ chambre }: { chambre: ChambreData }) {
  const [state, formAction] = useActionState(updateChambre, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={chambre.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Numéro *
          <input
            name="numero"
            required
            defaultValue={chambre.numero}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom
          <input
            name="nom"
            defaultValue={chambre.nom ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Type
          <select
            name="type"
            defaultValue={chambre.type}
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
            defaultValue={chambre.capacite}
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
            defaultValue={Number(chambre.prixNuit)}
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Statut
          <select
            name="statut"
            defaultValue={chambre.statut}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="OCCUPEE">OCCUPEE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="HORS_SERVICE">HORS_SERVICE</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Étage
          <input
            name="etage"
            type="number"
            defaultValue={chambre.etage ?? ""}
            inputMode="numeric"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Équipements (séparés par des virgules)
        <input
          name="equipements"
          defaultValue={chambre.equipements.join(", ")}
          aria-describedby="equipements-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
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
          defaultValue={chambre.description ?? ""}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
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

