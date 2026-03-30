"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Impossible d'envoyer l'email.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
        Mot de passe
      </p>
      <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
        Réinitialiser l&apos;accès
      </h2>
      <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
        Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de
        passe.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:rgba(220,38,38,0.1)] px-4 py-3 text-sm text-[color:var(--danger)]"
          >
            {error}
          </p>
        ) : null}

        {sent ? (
          <div className="rounded-2xl border border-[color:var(--success)]/40 bg-[color:rgba(5,150,105,0.08)] px-4 py-3 text-sm text-[color:var(--success)]">
            Si un compte existe, un email vient d&apos;être envoyé.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
        <span>Vous vous souvenez ?</span>
        <Link
          href="/login"
          className="font-semibold text-[color:var(--accent-strong)] hover:text-[color:var(--accent)]"
        >
          Retour connexion
        </Link>
      </div>
    </div>
  );
}
