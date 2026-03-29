"use client";

import { useFormState } from "react-dom";
import { addPaiement } from "../../actions/factures";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function PaiementForm({ factureId }: { factureId: string }) {
  const [state, formAction] = useFormState(addPaiement, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input type="hidden" name="factureId" value={factureId} />
      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Montant (XOF) *
        <input
          name="montant"
          type="number"
          step="0.01"
          min={0.01}
          required
          inputMode="decimal"
          placeholder="Ex. 25000"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Mode de paiement
        <select
          name="modePaiement"
          defaultValue="ESPECES"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        >
          <option value="ESPECES">ESPECES</option>
          <option value="VIREMENT">VIREMENT</option>
          <option value="MOBILE_MONEY">MOBILE_MONEY</option>
          <option value="CARTE_BANCAIRE">CARTE_BANCAIRE</option>
          <option value="CHEQUE">CHEQUE</option>
          <option value="AUTRE">AUTRE</option>
        </select>
        <span className="text-xs text-[color:var(--ink-muted)]">
          Référence obligatoire pour virement ou mobile money.
        </span>
      </label>
      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Référence
        <input
          name="reference"
          placeholder="Ex. MM-24-03-2026"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Enregistrer le paiement"
        loadingLabel="Enregistrement..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
