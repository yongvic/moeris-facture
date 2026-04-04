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
  const [evenement, clients] = await Promise.all([
    prisma.evenement.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            factures: {
              select: {
                id: true,
                numero: true,
                montantTotal: true,
                montantPaye: true,
                statut: true,
              },
            },
          },
        },
        factures: {
          where: { participantId: null },
          select: {
            id: true,
            numero: true,
            montantTotal: true,
            montantPaye: true,
            statut: true,
            client: { select: { prenom: true, nom: true } },
          },
        },
      },
    }),
    prisma.client.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

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
  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.prenom} ${client.nom ?? ""}`.trim(),
  }));

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
                    <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
                      Acompte: {Number(p.acomptePaye ?? 0).toLocaleString("fr-FR")} XOF •
                      Solde: {Number(p.soldeRestant ?? 0).toLocaleString("fr-FR")} XOF
                    </p>
                    {p.factures[0] ? (
                      <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
                        Facture liée: {p.factures[0].numero} • {p.factures[0].statut}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {evenement.factures.length > 0 ? (
            <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
              <h3 className="font-display text-xl text-[color:var(--ink)]">
                Factures événement
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {evenement.factures.map((facture) => (
                  <div
                    key={facture.id}
                    className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-[color:var(--ink)]">
                      {facture.numero}
                    </p>
                    <p className="text-xs text-[color:var(--ink-muted)]">
                      {facture.client?.prenom} {facture.client?.nom ?? ""} • {facture.statut}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
                      Total: {Number(facture.montantTotal).toLocaleString("fr-FR")} XOF • Payé: {Number(facture.montantPaye).toLocaleString("fr-FR")} XOF
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              Ajouter un participant
            </h3>
            <div className="mt-4">
              <ParticipantForm evenementId={evenement.id} clients={clientOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
