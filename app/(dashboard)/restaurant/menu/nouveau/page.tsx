import ProduitForm from "./ProduitForm";

export default function NouveauProduitPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Restaurant
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Nouveau produit
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Ajoutez un produit au menu.
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ProduitForm />
      </div>
    </div>
  );
}
