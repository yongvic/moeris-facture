"use client";

import { useActionState } from "react";
import { updateEvenement } from "../../actions/evenements";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type EvenementData = {
  id: string;
  titre: string;
  type: string;
  description?: string | null;
  dateDebut: Date;
  dateFin: Date;
  capaciteMax?: number | null;
  prixParParticipant?: number | null;
  prixForfait?: number | null;
  acompteRequis?: number | null;
  statut: string;
};

export default function EvenementEditForm({
  evenement,
}: {
  evenement: EvenementData;
}) {
  const [state, formAction] = useActionState(updateEvenement, initialState);
  const values = state.values ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={evenement.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Titre *
          <input
            name="titre"
            required
            defaultValue={values.titre ?? evenement.titre}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Ex. Soirée Jazz"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Type
          <select
            name="type"
            defaultValue={values.type ?? evenement.type}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="SOIREE">SOIREE</option>
            <option value="SEMINAIRE">SEMINAIRE</option>
            <option value="MARIAGE">MARIAGE</option>
            <option value="ANNIVERSAIRE">ANNIVERSAIRE</option>
            <option value="CONFERENCE">CONFERENCE</option>
            <option value="AUTRE">AUTRE</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Début *
          <input
            name="dateDebut"
            type="datetime-local"
            required
            defaultValue={
              values.dateDebut ?? evenement.dateDebut.toISOString().slice(0, 16)
            }
            aria-describedby="dates-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Fin *
          <input
            name="dateFin"
            type="datetime-local"
            required
            defaultValue={
              values.dateFin ?? evenement.dateFin.toISOString().slice(0, 16)
            }
            aria-describedby="dates-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <span id="dates-help" className="text-xs text-[color:var(--ink-muted)]">
            La fin doit être après le début.
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Capacité
          <input
            name="capaciteMax"
            type="number"
            min={1}
            defaultValue={values.capaciteMax ?? evenement.capaciteMax ?? ""}
            inputMode="numeric"
            placeholder="Optionnel"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix / participant (XOF)
          <input
            name="prixParParticipant"
            type="number"
            step="0.01"
            defaultValue={
              values.prixParParticipant ?? evenement.prixParParticipant ?? ""
            }
            min={0}
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix forfait (XOF)
          <input
            name="prixForfait"
            type="number"
            step="0.01"
            defaultValue={values.prixForfait ?? evenement.prixForfait ?? ""}
            min={0}
            inputMode="decimal"
            placeholder="Optionnel"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Acompte requis (XOF)
          <input
            name="acompteRequis"
            type="number"
            step="0.01"
            defaultValue={values.acompteRequis ?? evenement.acompteRequis ?? ""}
            min={0}
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Statut
        <select
          name="statut"
          defaultValue={values.statut ?? evenement.statut}
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        >
          <option value="A_VENIR">A_VENIR</option>
          <option value="EN_COURS">EN_COURS</option>
          <option value="TERMINE">TERMINE</option>
          <option value="ANNULE">ANNULE</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={values.description ?? evenement.description ?? ""}
          aria-describedby="description-help"
          className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
        />
        <span id="description-help" className="text-xs text-[color:var(--ink-muted)]">
          Indiquez l&apos;ambiance, le programme ou les besoins techniques.
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

