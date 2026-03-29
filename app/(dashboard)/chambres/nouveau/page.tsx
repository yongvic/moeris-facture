import ChambreForm from "./ChambreForm";

export default function NouvelleChambrePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Hébergement
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Nouvelle chambre
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Renseignez les informations de la chambre.
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ChambreForm />
      </div>
    </div>
  );
}
