"use client";

import { useActionState } from "react";
import { useState } from "react";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";
import { createFacture } from "../../actions/factures";

type ClientOption = { id: string; label: string };
type ReservationOption = { id: string; clientId: string; label: string };
type EvenementOption = {
  id: string;
  label: string;
  prixForfait: number | null;
  prixParParticipant: number | null;
};

const initialState = { error: "" };
const defaultTvaRate = process.env.NEXT_PUBLIC_DEFAULT_TVA_RATE ?? "18";

export default function FactureForm({
  clients,
  reservations,
  evenements,
}: {
  clients: ClientOption[];
  reservations: ReservationOption[];
  evenements: EvenementOption[];
}) {
  const [state, formAction] = useActionState(createFacture, initialState);
  const [reservationId, setReservationId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [evenementId, setEvenementId] = useState("");
  const disabled = clients.length === 0;

  const selectedEvent = evenements.find((item) => item.id === evenementId);

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
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Réservation liée
          <select
            name="reservationId"
            value={reservationId}
            onChange={(event) => {
              const nextReservationId = event.target.value;
              setReservationId(nextReservationId);
              if (nextReservationId) {
                const reservation = reservations.find(
                  (item) => item.id === nextReservationId
                );
                if (reservation) {
                  setSelectedClientId(reservation.clientId);
                }
                setEvenementId("");
              }
            }}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="">Aucune</option>
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Événement lié
          <select
            name="evenementId"
            value={evenementId}
            onChange={(event) => {
              setEvenementId(event.target.value);
              if (event.target.value) setReservationId("");
            }}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="">Aucun</option>
            {evenements.map((evenement) => (
              <option key={evenement.id} value={evenement.id}>
                {evenement.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          TVA (%)
          <input
            name="tauxTva"
            type="number"
            min={0}
            max={100}
            step="0.01"
            inputMode="decimal"
            defaultValue={defaultTvaRate}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink-muted)]">
          Vision Togo: TVA préremplie à 18% conformément au taux normal
          appliqué au secteur hôtelier depuis le 1er janvier 2024.
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Remise globale (XOF)
          <input
            name="remiseGlobale"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Remise (%)
          <input
            name="remisePourcent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        {clients.length === 0 ? (
          <p>
            Aucun client disponible. Crée d&apos;abord un client dans le CRM.
          </p>
        ) : (
          <p>Une réservation ajoute automatiquement la ligne de séjour. Un événement au forfait ajoute automatiquement la ligne forfaitaire.</p>
        )}
        {selectedEvent ? (
          <p>
            {selectedEvent.prixForfait
              ? `Événement au forfait détecté: ${selectedEvent.prixForfait.toLocaleString("fr-FR")} XOF sera ajouté.`
              : "Événement sans forfait: utilise plutôt les participants pour une facturation par personne."}
          </p>
        ) : null}
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

