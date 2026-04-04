import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import UserManagementPanel from "./UserManagementPanel";

export default async function SettingsPage() {
  const gate = await requireRole("ADMIN");
  if ("error" in gate) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      role: true,
      actif: true,
      createdAt: true,
    },
  });

  const metrics = [
    {
      label: "Utilisateurs actifs",
      value: users.filter((user) => user.actif).length,
      description: "Comptes capables de se connecter.",
    },
    {
      label: "Admins",
      value: users.filter((user) => user.role === "ADMIN").length,
      description: "Supervision complète et sécurité.",
    },
    {
      label: "Managers",
      value: users.filter((user) => user.role === "MANAGER").length,
      description: "Pilotage opérationnel quotidien.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Administration
        </p>
        <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
          Paramètres de la résidence
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
          Gérez les accès réels au produit, surveillez les comptes actifs et
          maintenez un back-office exploitable.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
              Indicateur
            </p>
            <h3 className="mt-3 font-display text-3xl text-[color:var(--ink)]">
              {metric.value}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
              {metric.label}
            </p>
            <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      <UserManagementPanel
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
