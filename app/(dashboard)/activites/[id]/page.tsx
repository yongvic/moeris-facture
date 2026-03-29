import { prisma } from "../../../../lib/prisma";
import ActiviteEditForm from "./ActiviteEditForm";

export default async function ActiviteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activite = await prisma.activite.findUnique({
    where: { id },
  });

  if (!activite) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Activité introuvable.
      </div>
    );
  }

  const activiteData = {
    ...activite,
    prix: Number(activite.prix),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Activité
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          {activite.nom}
        </h2>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <ActiviteEditForm activite={activiteData} />
      </div>
    </div>
  );
}
