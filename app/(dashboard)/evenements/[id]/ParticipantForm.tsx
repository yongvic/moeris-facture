"use client";

import { useActionState, useMemo, useState } from "react";
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
  const values = state.values ?? {};
  const [selectedClientIdOverride, setSelectedClientIdOverride] = useState<string | null>(null);
  const selectedClientId = selectedClientIdOverride ?? values.clientId ?? "";

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );
  const isExistingClient = Boolean(selectedClient);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="evenementId" value={evenementId} />
      <select
        name="clientId"
        aria-label="Client CRM"
        onChange={(event) => setSelectedClientIdOverride(event.target.value)}
        className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        defaultValue={selectedClientId}
      >
        <option value="">Nouveau participant hors CRM</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.label}
          </option>
        ))}
      </select>

      {isExistingClient ? (
        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink-muted)]">
          Les informations du client CRM sélectionné seront réutilisées. Tu peux saisir un acompte directement.
        </div>
      ) : null}

      {isExistingClient ? (
        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)]">
          Participant lié au client CRM: <span className="font-semibold">{selectedClient?.label}</span>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <input
            name="prenom"
            required
            aria-label="Prénom"
            placeholder="Prénom"
            defaultValue={values.prenom ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <input
            name="nom"
            required
            aria-label="Nom"
            placeholder="Nom"
            defaultValue={values.nom ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <input
            name="contact"
            placeholder="Contact"
            aria-label="Contact"
            inputMode="tel"
            defaultValue={values.contact ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </div>
      )}
      <input
        name="acomptePaye"
        type="number"
        min={0}
        step="0.01"
        placeholder="Acompte versé (optionnel)"
        aria-label="Acompte payé"
        defaultValue={values.acomptePaye ?? ""}
        className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
      />
      <p className="text-xs text-[color:var(--ink-muted)]">
        Pour un événement au forfait, sélectionne le client payeur pour réutiliser la même facture. Pour un client existant, son identité CRM est prioritaire.
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

