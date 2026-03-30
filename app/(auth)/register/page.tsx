"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom, nom, email, password }),
    });
    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Impossible de créer le compte.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
        Inscription
      </p>
      <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
        Créer un compte staff
      </h2>
      <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
        Renseignez les informations de l&apos;utilisateur à créer.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prénom
          <input
            type="text"
            required
            value={prenom}
            onChange={(event) => setPrenom(event.target.value)}
            autoComplete="given-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Jean"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Nom
          <input
            type="text"
            required
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            autoComplete="family-name"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="Doe"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="staff@moeris.com"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="••••••••"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Confirmer le mot de passe
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:rgba(220,38,38,0.1)] px-4 py-3 text-sm text-[color:var(--danger)]"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:rgba(5,150,105,0.08)] px-4 py-3 text-sm text-[color:var(--success)]">
            Compte créé avec succès. Vous pouvez maintenant vous connecter.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
        >
          {loading ? "Création..." : "Créer le compte"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
        <span>Déjà un compte ?</span>
        <Link
          href="/login"
          className="font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent)]"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
