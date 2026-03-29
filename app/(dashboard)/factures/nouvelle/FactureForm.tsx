"use client";

import { useActionState } from "react";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";
import { createFacture } from "../../actions/factures";

type ClientOption = { id: string; label: string };

const initialState = { error: "" };

export default function FactureForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction] = useActionState(createFacture, initialState);
  const disabled = clients.length === 0;

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Client *
          <select
            name="clientId"
            required
            disabled={disabled}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="">Sélectionner</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Notes internes
          <input
            name="notes"
            aria-describedby="notes-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Optionnel"
          />
          <span id="notes-help" className="text-xs text-[color:var(--ink-muted)]">
            Visible uniquement par l&apos;équipe.
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        {clients.length === 0 ? (
          <p>
            Aucun client disponible. Crée d&apos;abord un client dans le CRM.
          </p>
        ) : (
          <p>Vous pourrez ajouter des consommations et paiements après création.</p>
        )}
      </div>

      <FormError message={state.error} />

      <div className="mt-6">
        <SubmitButton
          disabled={disabled}
          label="Créer la facture"
          loadingLabel="Création..."
          className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        />
      </div>
    </form>
  );
}

