"use client";

import { useActionState } from "react";
import { createReservation } from "../../actions/reservations";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type Option = { id: string; label: string };

export default function ReservationForm({
  clients,
  chambres,
}: {
  clients: Option[];
  chambres: Option[];
}) {
  const [state, formAction] = useActionState(createReservation, initialState);
  const disabled = clients.length === 0 || chambres.length === 0;

  return (
    <form action={formAction} className="grid gap-4">
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
          Chambre *
          <select
            name="chambreId"
            required
            disabled={disabled}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="">Sélectionner</option>
            {chambres.map((chambre) => (
              <option key={chambre.id} value={chambre.id}>
                {chambre.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Date d&apos;arrivée *
          <input
            name="dateArrivee"
            type="date"
            required
            aria-describedby="dates-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Date de départ *
          <input
            name="dateDepart"
            type="date"
            required
            aria-describedby="dates-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <span id="dates-help" className="text-xs text-[color:var(--ink-muted)]">
            Le départ doit être après l&apos;arrivée.
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Adultes
          <input
            name="nombreAdultes"
            type="number"
            min={1}
            defaultValue={1}
            inputMode="numeric"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Enfants
          <input
            name="nombreEnfants"
            type="number"
            min={0}
            defaultValue={0}
            inputMode="numeric"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix négocié (XOF)
          <input
            name="prixNegocie"
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            placeholder="Optionnel"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Notes
        <textarea
          name="notes"
          rows={3}
          aria-describedby="notes-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="notes-help" className="text-xs text-[color:var(--ink-muted)]">
          Ajoutez les préférences ou besoins spécifiques.
        </span>
      </label>

      <FormError message={state.error} />

      <SubmitButton
        disabled={disabled}
        label="Créer la réservation"
        loadingLabel="Création..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      />
    </form>
  );
}

