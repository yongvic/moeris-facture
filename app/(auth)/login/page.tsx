"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (result?.error) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    } else {
      window.location.href = result?.url ?? "/dashboard";
    }
  };

  return (
    <div className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
        Connexion
      </p>
      <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
        Accéder à l&apos;espace staff
      </h2>
      <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
        Utilisez l&apos;email administrateur fourni pour démarrer.
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
            placeholder="admin@moeris.com"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
