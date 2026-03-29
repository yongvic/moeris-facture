import { prisma } from "../../../../lib/prisma";
import { createFacture } from "../../actions/factures";

export default async function NouvelleFacturePage() {
  const clients = await prisma.client.findMany({
    where: { actif: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Facturation
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Nouvelle facture
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Sélectionnez un client pour démarrer une facture.
        </p>
      </div>

      <form
        action={createFacture}
        className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Client *
            <select
              name="clientId"
              required
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
              <option value="">Sélectionner</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom ?? ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Notes internes
            <input
              name="notes"
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
            <p>
              Vous pourrez ajouter des consommations et paiements après création.
            </p>
          )}
        </div>

        <button className="mt-6 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">
          Créer la facture
        </button>
      </form>
    </div>
  );
}
