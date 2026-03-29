"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Produit = {
  id: string;
  nom: string;
  prix: number;
};

type Client = {
  id: string;
  prenom: string;
  nom?: string | null;
};

type CartItem = {
  id: string;
  nom: string;
  prix: number;
  qty: number;
};

export default function PosClient({
  produits,
  clients,
}: {
  produits: Produit[];
  clients: Client[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [modePaiement, setModePaiement] = useState("ESPECES");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + item.prix * item.qty, 0),
    [cart]
  );

  const addItem = (product: Produit) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        { id: product.id, nom: product.nom, prix: product.prix, qty: 1 },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const reset = () => {
    setCart([]);
    setClientId("");
    setQuickName("");
    setQuickPhone("");
    setModePaiement("ESPECES");
    setReference("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Ajoute au moins un produit.");
      return;
    }
    if (
      ["VIREMENT", "MOBILE_MONEY"].includes(modePaiement) &&
      !reference.trim()
    ) {
      setError("Référence obligatoire pour virement ou mobile money.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || undefined,
          client: clientId
            ? undefined
            : { prenom: quickName, telephone: quickPhone || undefined },
          items: cart.map((item) => ({ id: item.id, qty: item.qty })),
          modePaiement,
          reference: reference || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Erreur encaissement.");
      }

      const data = await res.json();
      const factureId = data.data.id;

      reset();
      window.location.href = `/factures/${factureId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <section className="rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
              Restaurant
            </p>
            <h2 className="mt-1 font-display text-2xl text-[color:var(--ink)]">
              POS rapide
            </h2>
          </div>
          <Link
            href="/restaurant/menu"
            className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-xs font-semibold text-[color:var(--ink)]"
          >
            Gérer le menu
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {produits.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-6 text-sm text-[color:var(--ink-muted)]">
              Aucun produit au menu.
            </div>
          ) : (
            produits.map((produit) => (
              <button
                key={produit.id}
                onClick={() => addItem(produit)}
                className="flex flex-col justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-left transition hover:border-[color:var(--accent)]"
              >
                <span className="text-sm font-semibold text-[color:var(--ink)]">
                  {produit.nom}
                </span>
                <span className="text-xs text-[color:var(--ink-muted)]">
                  {produit.prix.toLocaleString("fr-FR")} XOF
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4 rounded-3xl border border-[color:var(--stroke)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-muted)]">
            Panier
          </p>
          <h3 className="mt-1 font-display text-xl text-[color:var(--ink)]">
            Encaissement
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4 text-sm text-[color:var(--ink-muted)]">
              Sélectionne des produits pour commencer.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[color:var(--ink)]">
                    {item.nom}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--ink-muted)]">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, -1)}
                      aria-label={`Retirer un ${item.nom}`}
                      className="rounded-full border border-[color:var(--stroke)] px-2"
                    >
                      -
                    </button>
                    <span>Qté {item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, 1)}
                      aria-label={`Ajouter un ${item.nom}`}
                      className="rounded-full border border-[color:var(--stroke)] px-2"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="font-semibold text-[color:var(--ink)]">
                  {(item.prix * item.qty).toLocaleString("fr-FR")} XOF
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
            Client existant
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
            >
              <option value="">Client rapide</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom ?? ""}
                </option>
              ))}
            </select>
          </label>

          {!clientId ? (
            <div className="grid gap-3">
              <input
                placeholder="Prénom"
                value={quickName}
                onChange={(event) => setQuickName(event.target.value)}
                aria-label="Prénom"
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              />
              <input
                placeholder="Téléphone"
                value={quickPhone}
                onChange={(event) => setQuickPhone(event.target.value)}
                aria-label="Téléphone"
                inputMode="tel"
                className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              />
            </div>
          ) : null}
        </div>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Mode de paiement
          <select
            value={modePaiement}
            onChange={(event) => setModePaiement(event.target.value)}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="ESPECES">ESPECES</option>
            <option value="VIREMENT">VIREMENT</option>
            <option value="MOBILE_MONEY">MOBILE_MONEY</option>
            <option value="CARTE_BANCAIRE">CARTE_BANCAIRE</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="AUTRE">AUTRE</option>
          </select>
          <span className="text-xs text-[color:var(--ink-muted)]">
            Référence obligatoire pour virement ou mobile money.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Référence (optionnel)
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            aria-label="Référence"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:rgba(220,38,38,0.1)] px-4 py-3 text-sm text-[color:var(--danger)]"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-auto rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-4">
          <div className="flex items-center justify-between text-sm text-[color:var(--ink-muted)]">
            <span>Total</span>
            <span>{total.toLocaleString("fr-FR")} XOF</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            aria-busy={loading}
            className="mt-4 w-full rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? "Encaissement..." : "Encaisser"}
          </button>
        </div>
      </aside>
    </div>
  );
}
