"use client";

import { useActionState } from "react";
import { updateFactureSettings } from "../../actions/factures";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function FinancialSettingsForm({
  facture,
}: {
  facture: {
    id: string;
    tauxTva: number;
    remiseGlobale: number | null;
    remisePourcent: number | null;
    notes: string | null;
  };
}) {
  const [state, formAction] = useActionState(updateFactureSettings, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <input type="hidden" name="id" value={facture.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          TVA (%)
          <input
            name="tauxTva"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={facture.tauxTva}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Remise globale (XOF)
          <input
            name="remiseGlobale"
            type="number"
            step="0.01"
            min={0}
            defaultValue={facture.remiseGlobale ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Remise (%)
        <input
          name="remisePourcent"
          type="number"
          step="0.01"
          min={0}
          max={100}
          defaultValue={facture.remisePourcent ?? ""}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={facture.notes ?? ""}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
        />
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Mettre à jour le calcul"
        loadingLabel="Mise à jour..."
        className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      />
    </form>
  );
}
