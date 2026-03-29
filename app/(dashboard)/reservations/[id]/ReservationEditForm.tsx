"use client";

import { useActionState } from "react";
import { updateReservation, cancelReservation } from "../../actions/reservations";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type Option = { id: string; label: string };

type ReservationData = {
  id: string;
  clientId: string;
  chambreId: string;
  dateArrivee: Date;
  dateDepart: Date;
  nombreAdultes: number;
  nombreEnfants: number;
  prixNegocie?: number | null;
  statut: string;
  notes?: string | null;
};

export default function ReservationEditForm({
  reservation,
  clients,
  chambres,
}: {
  reservation: ReservationData;
  clients: Option[];
  chambres: Option[];
}) {
  const [state, formAction] = useActionState(updateReservation, initialState);
  const [cancelState, cancelAction] = useActionState(cancelReservation, initialState);

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="id" value={reservation.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Client
            <select
              name="clientId"
              defaultValue={reservation.clientId}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Chambre
            <select
              name="chambreId"
              defaultValue={reservation.chambreId}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
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
            Date d&apos;arrivée
            <input
              name="dateArrivee"
              type="date"
              defaultValue={reservation.dateArrivee.toISOString().slice(0, 10)}
              aria-describedby="dates-help"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Date de départ
            <input
              name="dateDepart"
              type="date"
              defaultValue={reservation.dateDepart.toISOString().slice(0, 10)}
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
              defaultValue={reservation.nombreAdultes}
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
              defaultValue={reservation.nombreEnfants}
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
              defaultValue={reservation.prixNegocie ?? ""}
              min={0}
              inputMode="decimal"
              placeholder="Optionnel"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Statut
          <select
            name="statut"
            defaultValue={reservation.statut}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="CONFIRMEE">CONFIRMEE</option>
            <option value="CHECK_IN_EFFECTUE">CHECK_IN_EFFECTUE</option>
            <option value="CHECK_OUT_EFFECTUE">CHECK_OUT_EFFECTUE</option>
            <option value="ANNULEE">ANNULEE</option>
            <option value="NO_SHOW">NO_SHOW</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={reservation.notes ?? ""}
            aria-describedby="notes-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <span id="notes-help" className="text-xs text-[color:var(--ink-muted)]">
            Ajoutez les préférences ou besoins spécifiques.
          </span>
        </label>

        <FormError message={state.error} />

        <SubmitButton
          label="Mettre à jour"
          loadingLabel="Mise à jour..."
          className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
        />
      </form>

      <form action={cancelAction} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <input type="hidden" name="id" value={reservation.id} />
        <div className="text-sm text-[color:var(--ink-muted)]">
          L&apos;annulation est immédiate et met fin à la réservation en cours.
        </div>
        <SubmitButton
          label="Annuler la réservation"
          loadingLabel="Annulation..."
          className="rounded-full border border-[color:var(--danger)]/40 px-5 py-3 text-sm font-semibold text-[color:var(--danger)]"
        />
        <FormError message={cancelState.error} />
      </form>
    </div>
  );
}

