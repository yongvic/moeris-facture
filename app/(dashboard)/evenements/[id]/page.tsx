import { prisma } from "../../../../lib/prisma";
import EvenementEditForm from "./EvenementEditForm";
import ParticipantForm from "./ParticipantForm";
import StatusBadge from "../../../components/StatusBadge";

const statusTone: Record<string, "info" | "warning" | "success" | "danger"> = {
  A_VENIR: "info",
  EN_COURS: "warning",
  TERMINE: "success",
  ANNULE: "danger",
};

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!evenement) {
    return (
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6">
        Événement introuvable.
      </div>
    );
  }

  const evenementData = {
    ...evenement,
    prixParParticipant: evenement.prixParParticipant
      ? Number(evenement.prixParParticipant)
      : null,
    prixForfait: evenement.prixForfait ? Number(evenement.prixForfait) : null,
    acompteRequis: evenement.acompteRequis ? Number(evenement.acompteRequis) : null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Événement
          </p>
          <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
            {evenement.titre}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
            {new Date(evenement.dateDebut).toLocaleDateString("fr-FR")} •{" "}
            {new Date(evenement.dateDebut).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusBadge tone={statusTone[evenement.statut] ?? "info"}>
          {evenement.statut}
        </StatusBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <EvenementEditForm evenement={evenementData} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Participants
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {evenement.participants.length === 0 ? (
                <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
                  Aucun participant inscrit.
                </div>
              ) : (
                evenement.participants.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-[color:var(--ink)]">
                      {p.prenom} {p.nom}
                    </p>
                    <p className="text-xs text-[color:var(--ink-muted)]">
                      {p.contact ?? "Contact non renseigné"} • {p.statut}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Ajouter un participant
            </h3>
            <div className="mt-4">
              <ParticipantForm evenementId={evenement.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
