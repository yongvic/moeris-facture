"use client";

import { useActionState } from "react";
import {
  updateReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  changeReservationStatus,
} from "../../actions/reservations";
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
  const [checkInState, checkInAction] = useActionState(checkInReservation, initialState);
  const [checkOutState, checkOutAction] = useActionState(checkOutReservation, initialState);
  const [statusState, statusAction] = useActionState(changeReservationStatus, initialState);
  const values = state.values ?? {};

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="id" value={reservation.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Client
            <select
              name="clientId"
              defaultValue={values.clientId ?? reservation.clientId}
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
              defaultValue={values.chambreId ?? reservation.chambreId}
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
              defaultValue={
                values.dateArrivee ?? reservation.dateArrivee.toISOString().slice(0, 10)
              }
              aria-describedby="dates-help"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Date de départ
            <input
              name="dateDepart"
              type="date"
              defaultValue={
                values.dateDepart ?? reservation.dateDepart.toISOString().slice(0, 10)
              }
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
              defaultValue={values.nombreAdultes ?? reservation.nombreAdultes}
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
              defaultValue={values.nombreEnfants ?? reservation.nombreEnfants}
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
              defaultValue={values.prixNegocie ?? reservation.prixNegocie ?? ""}
              min={0}
              inputMode="decimal"
              placeholder="Optionnel"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
            Statut actuel
          </p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
            {reservation.statut}
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={values.notes ?? reservation.notes ?? ""}
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

      <form action={statusAction} className="grid gap-3 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-5">
        <input type="hidden" name="id" value={reservation.id} />
        <p className="text-sm font-semibold text-[color:var(--ink)]">Modifier le statut</p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Nouveau statut
            <select
              name="statut"
              defaultValue={reservation.statut}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            >
              <option value="CONFIRMEE">CONFIRMEE</option>
              <option value="CHECK_IN_EFFECTUE">CHECK_IN_EFFECTUE</option>
              <option value="CHECK_OUT_EFFECTUE">CHECK_OUT_EFFECTUE</option>
              <option value="NO_SHOW">NO_SHOW</option>
              <option value="ANNULEE">ANNULEE</option>
            </select>
          </label>
          <SubmitButton
            label="Appliquer le statut"
            loadingLabel="Application..."
            className="rounded-full border border-[color:var(--stroke)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)]"
          />
        </div>
        <FormError message={statusState.error} />
      </form>

      <div className="grid gap-3 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-5">
        <p className="text-sm font-semibold text-[color:var(--ink)]">Workflow séjour</p>
        <p className="text-sm text-[color:var(--ink-muted)]">
          Utilise ces actions métier pour aligner le statut de la réservation et celui de la chambre.
        </p>
        <div className="flex flex-col gap-3 md:flex-row">
          <form action={checkInAction} className="flex-1">
            <input type="hidden" name="id" value={reservation.id} />
            <SubmitButton
              label="Enregistrer le check-in"
              loadingLabel="Check-in..."
              className="w-full rounded-full border border-[color:var(--accent)]/40 px-5 py-3 text-sm font-semibold text-[color:var(--accent)]"
            />
          </form>
          <form action={checkOutAction} className="flex-1">
            <input type="hidden" name="id" value={reservation.id} />
            <SubmitButton
              label="Enregistrer le check-out"
              loadingLabel="Check-out..."
              className="w-full rounded-full border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-600"
            />
          </form>
        </div>
        <FormError message={checkInState.error || checkOutState.error} />
      </div>

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

