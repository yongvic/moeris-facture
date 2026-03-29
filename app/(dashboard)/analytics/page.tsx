import { prisma } from "../../../lib/prisma";
import { formatXof } from "../../../lib/format";

export default async function AnalyticsPage() {
  const [totalRevenue, roomsTotal, roomsOccupied, unpaidCount, payments, topClientsRaw] =
    await Promise.all([
      prisma.paiement.aggregate({ _sum: { montant: true } }),
      prisma.chambre.count(),
      prisma.chambre.count({ where: { statut: "OCCUPEE" } }),
      prisma.facture.count({
        where: { statut: { in: ["OUVERTE", "PARTIELLEMENT_PAYEE"] } },
      }),
      prisma.paiement.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        select: { montant: true, createdAt: true },
      }),
      prisma.facture.groupBy({
        by: ["clientId"],
        _sum: { montantTotal: true },
        orderBy: { _sum: { montantTotal: "desc" } },
        take: 3,
      }),
    ]);

  const occupationRate = roomsTotal
    ? Math.round((roomsOccupied / roomsTotal) * 100)
    : 0;

  const comparisons = [
    {
      label: "Revenu total",
      value: formatXof(Number(totalRevenue._sum.montant ?? 0)),
      delta: "Année en cours",
    },
    {
      label: "Taux d'occupation",
      value: `${occupationRate}%`,
      delta: "Aujourd’hui",
    },
    {
      label: "Factures impayées",
      value: `${unpaidCount}`,
      delta: "À relancer",
    },
  ];

  const monthly = Array.from({ length: 12 }, () => 0);
  payments.forEach((p) => {
    const month = p.createdAt.getMonth();
    monthly[month] += Number(p.montant);
  });

  const topClientIds = topClientsRaw.map((item) => item.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: topClientIds } },
    select: { id: true, prenom: true, nom: true },
  });
  const clientMap = new Map(
    clients.map((client) => [
      client.id,
      `${client.prenom} ${client.nom ?? ""}`.trim(),
    ])
  );

  const topClients = topClientsRaw.map((item) => ({
    nom: clientMap.get(item.clientId) ?? "Client",
    montant: formatXof(Number(item._sum.montantTotal ?? 0)),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Analytics
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Performance & revenus
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {comparisons.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                {item.value}
              </p>
              <p className="text-sm font-semibold text-[color:var(--success)]">
                {item.delta}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Revenus mensuels
          </p>
          <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Evolution année N
          </h3>
          <div className="mt-6 grid grid-cols-12 items-end gap-2">
            {monthly.map((value, index) => (
              <div key={`bar-${index}`} className="flex flex-col items-center">
                <div
                  className="w-full rounded-full bg-[color:var(--accent)]"
                  style={{ height: `${Math.min(96, Math.max(12, value / 50000))}px` }}
                />
                <span className="mt-2 text-[10px] text-[color:var(--ink-muted)]">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Top clients
          </p>
          <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Chiffre d&apos;affaires
          </h3>
          <div className="mt-6 flex flex-col gap-4">
            {topClients.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink-muted)]">
                Pas encore de données clients.
              </div>
            ) : (
              topClients.map((client) => (
                <div
                  key={client.nom}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {client.nom}
                  </p>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {client.montant}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
