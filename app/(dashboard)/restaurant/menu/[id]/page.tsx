import { prisma } from "../../../../../lib/prisma";
import ProduitEditForm from "./ProduitEditForm";

export default async function ProduitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produit = await prisma.produit.findUnique({
    where: { id },
  });

  if (!produit) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Produit introuvable.
      </div>
    );
  }

  const produitData = {
    ...produit,
    prix: Number(produit.prix),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Produit
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          {produit.nom}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          {produit.categorie}
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ProduitEditForm produit={produitData} />
      </div>
    </div>
  );
}
