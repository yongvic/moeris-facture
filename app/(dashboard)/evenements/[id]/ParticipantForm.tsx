"use client";

import { useFormState } from "react-dom";
import { addParticipant } from "../../actions/evenements";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

export default function ParticipantForm({ evenementId }: { evenementId: string }) {
  const [state, formAction] = useFormState(addParticipant, initialState);

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

      <FormError message={state.error} />

      <SubmitButton
        label="Ajouter participant"
        loadingLabel="Ajout..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}
