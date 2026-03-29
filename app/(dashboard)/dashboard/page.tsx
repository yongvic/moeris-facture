import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  OUVERTE: "neutral",
  PARTIELLEMENT_PAYEE: "warning",
  PAYEE: "success",
  ANNULEE: "danger",
};

const statusLabel: Record<string, string> = {
  OUVERTE: "Ouverte",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const serviceLabels: Record<string, string> = {
  CHAMBRE: "Hébergement",
  RESTAURANT: "Restaurant",
  ACTIVITE: "Activités",
  EVENEMENT: "Événements",
  DIVERS: "Divers",
};

export default async function DashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    revenueAgg,
    chambreOccupees,
    chambresTotal,
    facturesOuvertes,
    clientsPresents,
    factures,
    chambresByStatut,
    serviceAgg,
    evenements,
    activites,
  ] = await Promise.all([
    prisma.paiement.aggregate({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      _sum: { montant: true },
    }),
    prisma.chambre.count({ where: { statut: "OCCUPEE" } }),
    prisma.chambre.count(),
    prisma.facture.count({ where: { statut: "OUVERTE" } }),
    prisma.reservation.count({ where: { statut: "CHECK_IN_EFFECTUE" } }),
    prisma.facture.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true },
    }),
    prisma.chambre.groupBy({
      by: ["statut"],
      _count: { _all: true },
    }),
    prisma.consommation.groupBy({
      by: ["categorie"],
      _sum: { sousTotal: true },
    }),
    prisma.evenement.findMany({
      where: { dateDebut: { gte: startOfDay } },
      orderBy: { dateDebut: "asc" },
      take: 3,
    }),
    prisma.activite.findMany({
      where: { disponible: true },
      take: 3,
    }),
  ]);

  const revenue = Number(revenueAgg._sum.montant ?? 0);
  const occupation = chambresTotal
    ? Math.round((chambreOccupees / chambresTotal) * 100)
    : 0;

  const kpis = [
    {
      label: "Revenu du jour",
      value: formatXof(revenue),
      delta: "Aujourd’hui",
      tone: "success",
    },
    {
      label: "Chambres occupées",
      value: `${chambreOccupees} / ${chambresTotal}`,
      delta: `${occupation}%`,
      tone: "info",
    },
    {
      label: "Factures ouvertes",
      value: `${facturesOuvertes}`,
      delta: "À encaisser",
      tone: "warning",
    },
    {
      label: "Clients présents",
      value: `${clientsPresents}`,
      delta: "Check-in",
      tone: "neutral",
    },
  ];

  const roomStatus = ["DISPONIBLE", "OCCUPEE", "MAINTENANCE", "HORS_SERVICE"].map(
    (statut) => {
      const entry = chambresByStatut.find((item) => item.statut === statut);
      const count = entry?._count._all ?? 0;
      return {
        label:
          statut === "DISPONIBLE"
            ? "Disponibles"
            : statut === "OCCUPEE"
            ? "Occupées"
            : statut === "MAINTENANCE"
            ? "Maintenance"
            : "Hors service",
        value: count,
        tone:
          statut === "DISPONIBLE"
            ? "success"
            : statut === "OCCUPEE"
            ? "info"
            : statut === "MAINTENANCE"
            ? "danger"
            : "warning",
      };
    }
  );

  const serviceTotals = serviceAgg.map((item) => ({
    label: serviceLabels[item.categorie] ?? item.categorie,
    value: Number(item._sum.sousTotal ?? 0),
  }));
  const totalService = serviceTotals.reduce((acc, item) => acc + item.value, 0);
  const services = serviceTotals.map((item) => ({
    label: item.label,
    value: totalService ? Math.round((item.value / totalService) * 100) : 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            tone={kpi.tone as "neutral" | "success" | "warning" | "info"}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
                Suivi instantané
              </p>
              <h2 className="mt-1 font-display text-xl text-[color:var(--ink)]">
                Factures en cours
              </h2>
            </div>
            <button className="rounded-full border border-[color:var(--stroke)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
              Exporter
            </button>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--stroke)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[color:var(--paper-2)] text-[color:var(--ink-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Facture</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
            {factures.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-sm text-[color:var(--ink-muted)]"
                  colSpan={4}
                >
                  Aucune facture en cours pour le moment.
                </td>
              </tr>
            ) : (
              factures.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[color:var(--stroke)]">
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      {invoice.numero}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ink-muted)]">
                      {invoice.client?.prenom} {invoice.client?.nom ?? ""}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[color:var(--ink)]">
                      {formatXof(Number(invoice.montantTotal))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={statusTone[invoice.statut] ?? "neutral"}
                      >
                        {statusLabel[invoice.statut] ?? invoice.statut}
                      </StatusBadge>
                    </td>
                  </tr>
              ))
            )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Disponibilités
          </p>
          <h2 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Statut des chambres
          </h2>
          <div className="mt-6 grid gap-4">
            {roomStatus.map((room) => (
              <div
                key={room.label}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {room.label}
                </p>
                <StatusBadge tone={room.tone as "success" | "warning" | "danger" | "info"}>
                  {room.value}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Répartition
          </p>
          <h2 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Revenus par service
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {services.map((service) => (
              <div key={service.label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[color:var(--ink)]">
                    {service.label}
                  </span>
                  <span className="text-[color:var(--ink-muted)]">
                    {service.value}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[color:var(--paper-2)]">
                  <div
                    className="h-2 rounded-full bg-[color:var(--accent)]"
                    style={{ width: `${service.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Aujourd'hui
          </p>
          <h2 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Activités & événements
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {evenements.length === 0 && activites.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink-muted)]">
                Rien de planifié pour aujourd&apos;hui.
              </div>
            ) : (
              [
                ...evenements.map((event) => ({
                  title: event.titre,
                  time: `${event.dateDebut.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${event.dateFin.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`,
                  badge: "Événement",
                })),
                ...activites.map((activity) => ({
                  title: activity.nom,
                  time: "Disponible",
                  badge: "Activité",
                })),
              ].slice(0, 3).map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[color:var(--ink-muted)]">
                    {item.time}
                  </p>
                </div>
                <StatusBadge tone="info">{item.badge}</StatusBadge>
              </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
