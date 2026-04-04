"use client";

import { useActionState } from "react";
import { addParticipant } from "../../actions/evenements";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type ClientOption = { id: string; label: string };

export default function ParticipantForm({
  evenementId,
  clients,
}: {
  evenementId: string;
  clients: ClientOption[];
}) {
  const [state, formAction] = useActionState(addParticipant, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="evenementId" value={evenementId} />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="prenom"
          required
          aria-label="Prénom"
          placeholder="Prénom"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <input
          name="nom"
          required
          aria-label="Nom"
          placeholder="Nom"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <input
          name="contact"
          placeholder="Contact"
          aria-label="Contact"
          inputMode="tel"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </div>
      <select
        name="clientId"
        aria-label="Client CRM"
        className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        defaultValue=""
      >
        <option value="">Créer ou retrouver automatiquement le client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.label}
          </option>
        ))}
      </select>
      <input
        name="acomptePaye"
        type="number"
        min={0}
        step="0.01"
        placeholder="Acompte versé (optionnel)"
        aria-label="Acompte payé"
        className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
      />
      <p className="text-xs text-[color:var(--ink-muted)]">
        Pour un événement au forfait, sélectionne le client payeur pour réutiliser la même facture au lieu de créer des doublons.
      </p>

      <FormError message={state.error} />

      <SubmitButton
        label="Ajouter participant"
        loadingLabel="Ajout..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}

