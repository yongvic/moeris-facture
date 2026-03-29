import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { formatXof } from "../../../../lib/format";

export default async function MenuPage() {
  const produits = await prisma.produit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Restaurant
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Catalogue menu
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Gérez les produits et leurs disponibilités.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/restaurant/pos"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Retour POS
          </Link>
          <Link
            href="/restaurant/menu/nouveau"
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
          >
            Nouveau produit
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {produits.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                  >
                    Aucun produit enregistré.
                  </td>
                </tr>
              ) : (
                produits.map((produit) => (
                  <tr
                    key={produit.id}
                    className="border-t border-[color:var(--stroke)]"
                  >
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      <Link
                        href={`/restaurant/menu/${produit.id}`}
                        className="hover:underline"
                      >
                        {produit.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {produit.categorie}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      {formatXof(Number(produit.prix))}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {produit.archive
                        ? "Archivé"
                        : produit.disponible
                        ? "Disponible"
                        : "Indisponible"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
