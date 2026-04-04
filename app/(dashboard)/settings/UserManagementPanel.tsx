"use client";

import { useActionState } from "react";
import { createStaffUser, updateStaffUser } from "../actions/users";
import FormError from "../../components/FormError";
import SubmitButton from "../../components/SubmitButton";
import StatusBadge from "../../components/StatusBadge";

type UserItem = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  actif: boolean;
  createdAt: string;
};

const initialState = { error: "" };

export default function UserManagementPanel({
  users,
}: {
  users: UserItem[];
}) {
  const [createState, createAction] = useActionState(createStaffUser, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Provisioning
        </p>
        <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
          Créer un collaborateur
        </h3>
        <form action={createAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
              Prénom
              <input
                name="prenom"
                required
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
              Nom
              <input
                name="nom"
                required
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-[1fr_0.5fr]">
            <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
              Mot de passe temporaire
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              />
              <span className="text-xs text-[color:var(--ink-muted)]">
                8 caractères minimum avec majuscule, minuscule, chiffre et symbole.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
              Rôle
              <select
                name="role"
                defaultValue="STAFF"
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </div>
          <FormError message={createState.error} />
          <SubmitButton
            label="Créer le compte"
            loadingLabel="Création..."
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          />
        </form>
      </section>

      <section className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
          Gouvernance
        </p>
        <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
          Utilisateurs et droits
        </h3>
        <div className="mt-6 flex flex-col gap-4">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      </section>
    </div>
  );
}

function UserRow({ user }: { user: UserItem }) {
  const [state, action] = useActionState(updateStaffUser, initialState);

  return (
    <form
      action={action}
      className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] p-4"
    >
      <input type="hidden" name="userId" value={user.id} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[color:var(--ink)]">
              {user.prenom} {user.nom}
            </p>
            <StatusBadge tone={user.actif ? "success" : "danger"}>
              {user.actif ? "Actif" : "Inactif"}
            </StatusBadge>
            <StatusBadge tone={user.role === "ADMIN" ? "warning" : "info"}>
              {user.role}
            </StatusBadge>
          </div>
          <p className="text-sm text-[color:var(--ink-muted)]">{user.email}</p>
          <p className="text-xs text-[color:var(--ink-muted)]">
            Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[160px_140px_auto] md:items-end">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Rôle
            <select
              name="role"
              defaultValue={user.role}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Statut
            <select
              name="actif"
              defaultValue={String(user.actif)}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </label>

          <SubmitButton
            label="Enregistrer"
            loadingLabel="Mise à jour..."
            className="rounded-full border border-[color:var(--stroke)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)]"
          />
        </div>
      </div>
      <div className="mt-3">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
