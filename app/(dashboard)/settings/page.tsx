const sections = [
  {
    title: "Taxes & remises",
    description: "Configurer TVA, taxes touristiques et remises automatiques.",
  },
  {
    title: "Rôles & permissions",
    description: "Gérer ADMIN, MANAGER et STAFF avec accès ciblés.",
  },
  {
    title: "Modes de paiement",
    description: "Activer cash, mobile money, virement, carte bancaire.",
  },
  {
    title: "Catalogue services",
    description: "Chambres, menus restaurant, activités et événements.",
  },
];

export default function SettingsPage() {
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
          Centralisez les règles métiers et la configuration globale.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <h3 className="font-display text-xl text-[color:var(--ink)]">
              {section.title}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
              {section.description}
            </p>
            <button className="mt-4 rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
              Configurer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
