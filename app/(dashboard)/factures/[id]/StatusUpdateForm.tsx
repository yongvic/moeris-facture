"use client";

import { useActionState } from "react";
import { updateFactureStatus } from "../../actions/factures";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function StatusUpdateForm({ factureId }: { factureId: string }) {
  const [state, formAction] = useActionState(updateFactureStatus, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-3">
      <input type="hidden" name="id" value={factureId} />
      <SubmitButton
        name="statut"
        value="PAYEE"
        label="Marquer comme payée"
        loadingLabel="Mise à jour..."
        className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
      />
      <SubmitButton
        name="statut"
        value="ANNULEE"
        label="Annuler la facture"
        loadingLabel="Annulation..."
        className="rounded-full border border-[color:var(--danger)]/40 px-4 py-2 text-sm font-semibold text-[color:var(--danger)]"
      />
      <FormError message={state.error} />
    </form>
  );
}

