import { prisma } from "../../../lib/prisma";

const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const statusClasses: Record<string, string> = {
  DISPONIBLE: "bg-[color:rgba(5,150,105,0.25)]",
  OCCUPEE: "bg-[color:rgba(37,99,235,0.2)]",
  MAINTENANCE: "bg-[color:rgba(220,38,38,0.2)]",
  HORS_SERVICE: "bg-[color:rgba(217,119,6,0.25)]",
};

export default async function ChambresPage() {
  const chambres = await prisma.chambre.findMany({
    orderBy: { numero: "asc" },
    take: 12,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Hébergement
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            Planning des chambres
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            Vue 30 jours avec codes couleur temps réel.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
            Ajouter chambre
          </button>
          <button className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">
            Nouvelle réservation
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="grid grid-cols-8 gap-2 text-xs text-[color:var(--ink-muted)]">
          <div className="col-span-2">Chambre</div>
          {jours.map((jour) => (
            <div key={jour} className="text-center">
              {jour}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {chambres.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-6 text-sm text-[color:var(--ink-muted)]">
              Aucune chambre enregistrée.
            </div>
          ) : (
            chambres.map((chambre) => (
            <div key={chambre.id} className="grid grid-cols-8 gap-2">
              <div className="col-span-2 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-3 py-2 text-sm font-semibold text-[color:var(--ink)]">
                {chambre.nom ?? chambre.numero}
              </div>
              {jours.map((jour) => (
                <div
                  key={`${chambre.id}-${jour}`}
                  className={`h-9 rounded-xl border border-[color:var(--stroke)] ${
                    statusClasses[chambre.statut] ?? "bg-[color:var(--paper-2)]"
                  }`}
                />
              ))}
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
