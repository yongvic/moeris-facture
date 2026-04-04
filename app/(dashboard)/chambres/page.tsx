import Image from "next/image";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import CsvImportForm from "../../components/CsvImportForm";
import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";
import { importChambresCsv } from "../actions/chambres";

const statusTone: Record<string, "success" | "info" | "danger" | "warning" | "neutral"> = {
  DISPONIBLE: "success",
  RESERVEE: "neutral",
  OCCUPEE: "info",
  MAINTENANCE: "danger",
  HORS_SERVICE: "warning",
};

type SearchParams = Promise<{
  q?: string;
  type?: string;
  statut?: string;
}>;

export default async function ChambresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const type = filters.type?.trim() ?? "";
  const statut = filters.statut?.trim() ?? "";
  const chambres = await prisma.chambre.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { numero: { contains: q, mode: "insensitive" } },
              { nom: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(type ? { type: type as never } : {}),
      ...(statut ? { statut: statut as never } : {}),
    },
    orderBy: { numero: "asc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Hébergement
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Inventaire des chambres
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Vue exploitable des statuts, capacités et tarifs réellement
            configurés.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/chambres/nouveau"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] text-center"
          >
            Ajouter chambre
          </Link>
          <Link
            href="/reservations/nouvelle"
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white text-center"
          >
            Nouvelle réservation
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
              placeholder="Numéro ou nom"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Type
            <select
              name="type"
              defaultValue={type}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
            >
              <option value="">Tous</option>
              <option value="STANDARD">STANDARD</option>
              <option value="SUPERIEURE">SUPERIEURE</option>
              <option value="SUITE">SUITE</option>
              <option value="BUNGALOW">BUNGALOW</option>
              <option value="VILLA">VILLA</option>
              <option value="DUPLEX">DUPLEX</option>
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
              <option value="RESERVEE">Réservée</option>
              <option value="OCCUPEE">Occupée</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="HORS_SERVICE">Hors service</option>
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
          action={importChambresCsv}
          title="Import chambres Excel/CSV"
          hint="Importe un CSV exporté depuis Excel. Colonnes supportées: numero, nom, type, capacite, prixNuit, description, equipements, statut, etage, photoUrls. Sépare équipements et photos par |."
        />
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Chambre</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Capacité</th>
                <th className="px-4 py-3 font-medium">Prix / nuit</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
          {chambres.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                >
                  Aucune chambre enregistrée.
                </td>
              </tr>
          ) : (
            chambres.map(
              (chambre) => (
                <tr
                  key={chambre.id}
                  className="border-t border-[color:var(--stroke)]"
                >
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)]">
                          {chambre.photoUrls[0] ? (
                            <Image
                              src={chambre.photoUrls[0]}
                              alt={chambre.nom ?? chambre.numero}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <Link
                          href={`/chambres/${chambre.id}`}
                          className="hover:underline"
                        >
                          {chambre.nom ?? chambre.numero}
                        </Link>
                      </div>
                    </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {chambre.type}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                    {chambre.capacite} pers.
                  </td>
                  <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                    {formatXof(Number(chambre.prixNuit))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone[chambre.statut] ?? "info"}>
                      {chambre.statut}
                    </StatusBadge>
                  </td>
                </tr>
              )
            )
          )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
