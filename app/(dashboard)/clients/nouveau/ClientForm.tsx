"use client";

import { useFormState } from "react-dom";
import { createClient } from "../../actions/clients";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function ClientForm() {
  const [state, formAction] = useFormState(createClient, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prénom *
          <input
            name="prenom"
            required
            autoComplete="given-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Aïcha"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom
          <input
            name="nom"
            autoComplete="family-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Diallo"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="aicha@email.com"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Téléphone
          <input
            name="telephone"
            inputMode="tel"
            autoComplete="tel"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="+228 90 00 00 00"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Date de naissance
          <input
            name="dateNaissance"
            type="date"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Segment
          <select
            name="segment"
            aria-describedby="segment-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            defaultValue="STANDARD"
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
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Numéro de pièce
          <input
            name="numeroPiece"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Adresse
        <input
          name="adresse"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Notes internes
        <textarea
          name="notes"
          rows={3}
          aria-describedby="notes-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="notes-help" className="text-xs text-[color:var(--ink-muted)]">
          Visible uniquement par l&apos;équipe.
        </span>
      </label>

      <FormError message={state.error} />

      <SubmitButton
        label="Enregistrer le client"
        loadingLabel="Enregistrement..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
