import Link from "next/link";
import CsvImportForm from "../../../components/CsvImportForm";
import { prisma } from "../../../../lib/prisma";
import { formatXof } from "../../../../lib/format";
import { importProduitsCsv } from "../../actions/produits";

type SearchParams = Promise<{
  q?: string;
  categorie?: string;
  statut?: string;
}>;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const categorie = filters.categorie?.trim() ?? "";
  const statut = filters.statut?.trim() ?? "";

  const [produits, categories] = await Promise.all([
    prisma.produit.findMany({
      where: {
        ...(categorie
          ? { categorie: { equals: categorie, mode: "insensitive" } }
          : {}),
        ...(statut === "ARCHIVE"
          ? { archive: true }
          : statut === "DISPONIBLE"
            ? { archive: false, disponible: true }
            : statut === "INDISPONIBLE"
              ? { archive: false, disponible: false }
              : {}),
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: "insensitive" } },
                { categorie: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.produit.findMany({
      distinct: ["categorie"],
      select: { categorie: true },
      orderBy: { categorie: "asc" },
    }),
  ]);

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
            Filtres réels, disponibilité claire et import CSV prêt à l’emploi.
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

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <form className="grid gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-end">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Recherche
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Produit ou catégorie"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Catégorie
            <select
              name="categorie"
              defaultValue={categorie}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            >
              <option value="">Toutes</option>
              {categories.map((item) => (
                <option key={item.categorie} value={item.categorie}>
                  {item.categorie}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Statut
            <select
              name="statut"
              defaultValue={statut}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            >
              <option value="">Tous</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="INDISPONIBLE">Indisponible</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            Filtrer
          </button>
        </form>

        <CsvImportForm
          action={importProduitsCsv}
          title="Import produits"
          hint="Colonnes supportées: nom, categorie, prix, description, disponible, archive, imageUrl."
        />
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
                    Aucun produit trouvé avec ces filtres.
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
