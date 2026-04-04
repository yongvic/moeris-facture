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
      <div className="text-sm text-[color:var(--ink-muted)]">
        L’encaissement doit passer par l’ajout d’un paiement pour conserver une comptabilité exacte.
      </div>
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

