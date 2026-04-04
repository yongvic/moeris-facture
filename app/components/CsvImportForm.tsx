"use client";

import { useActionState } from "react";
import FormError from "./FormError";
import SubmitButton from "./SubmitButton";

type ImportState = {
  error?: string;
  message?: string;
};

type ImportAction = (
  state: ImportState,
  formData: FormData
) => Promise<ImportState>;

const initialState: ImportState = {};

export default function CsvImportForm({
  action,
  title,
  hint,
}: {
  action: ImportAction;
  title: string;
  hint: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] p-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--ink)]">{title}</p>
        <p className="mt-1 text-xs text-[color:var(--ink-muted)]">{hint}</p>
      </div>

      <input
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="rounded-2xl border border-[color:var(--stroke)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
      />

      {state.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      ) : null}
      <FormError message={state.error} />

      <SubmitButton
        label="Importer le CSV"
        loadingLabel="Import en cours..."
        className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      />
    </form>
  );
}
