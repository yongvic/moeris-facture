import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import FactureForm from "./FactureForm";

export default async function NouvelleFacturePage() {
  const clients = await prisma.client.findMany({
    where: { actif: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.prenom} ${client.nom ?? ""}`.trim(),
  }));

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

      <FactureForm clients={clientOptions} />
      {clients.length === 0 ? (
        <div className="mt-4">
          <Link
            href="/clients/nouveau"
            className="text-sm font-semibold text-[color:var(--accent)]"
          >
            Créer un client
          </Link>
        </div>
      ) : null}
    </div>
  );
}
