"use client";

import { useActionState } from "react";
import { updateClient } from "../../actions/clients";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type ClientData = {
  id: string;
  prenom: string;
  nom?: string | null;
  email?: string | null;
  telephone?: string | null;
  dateNaissance?: Date | null;
  nationalite?: string | null;
  numeroPiece?: string | null;
  adresse?: string | null;
  notes?: string | null;
  segment?: string | null;
};

export default function ClientEditForm({ client }: { client: ClientData }) {
  const [state, formAction] = useActionState(updateClient, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={client.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prénom *
          <input
            name="prenom"
            required
            defaultValue={client.prenom}
            autoComplete="given-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom
          <input
            name="nom"
            defaultValue={client.nom ?? ""}
            autoComplete="family-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Email
          <input
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
            autoComplete="email"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Téléphone
          <input
            name="telephone"
            defaultValue={client.telephone ?? ""}
            inputMode="tel"
            autoComplete="tel"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Date de naissance
          <input
            name="dateNaissance"
            type="date"
            defaultValue={
              client.dateNaissance
                ? client.dateNaissance.toISOString().slice(0, 10)
                : ""
            }
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Segment
          <select
            name="segment"
            defaultValue={client.segment ?? "STANDARD"}
            aria-describedby="segment-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="FREQUENT">FREQUENT</option>
            <option value="VIP">VIP</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <span id="segment-help" className="text-xs text-[color:var(--ink-muted)]">
            Utilisez VIP/PREMIUM pour un suivi renforcé.
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nationalité
          <input
            name="nationalite"
            defaultValue={client.nationalite ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Numéro de pièce
          <input
            name="numeroPiece"
            defaultValue={client.numeroPiece ?? ""}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Adresse
        <input
          name="adresse"
          defaultValue={client.adresse ?? ""}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Notes internes
        <textarea
          name="notes"
          rows={3}
          defaultValue={client.notes ?? ""}
          aria-describedby="notes-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="notes-help" className="text-xs text-[color:var(--ink-muted)]">
          Visible uniquement par l&apos;équipe.
        </span>
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

