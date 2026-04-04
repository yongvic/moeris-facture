"use client";

import { useActionState, useMemo, useState } from "react";
import { addConsommation } from "../../actions/factures";
import FormError from "../../../components/FormError";
import SubmitButton from "../../../components/SubmitButton";

const initialState = { error: "" };

type ProduitOption = {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
};

type ActiviteOption = {
  id: string;
  nom: string;
  prix: number;
  prixParUnite: string;
  gratuit: boolean;
};

export default function ConsommationForm({
  factureId,
  produits,
  activites,
  reservation,
  evenementTitre,
}: {
  factureId: string;
  produits: ProduitOption[];
  activites: ActiviteOption[];
  reservation: { chambre: string; prixNuit: number; nombreNuits: number } | null;
  evenementTitre: string | null;
}) {
  const [state, formAction] = useActionState(addConsommation, initialState);
  const [categorie, setCategorie] = useState("DIVERS");
  const [produitId, setProduitId] = useState("");
  const [activiteId, setActiviteId] = useState("");

  const selectedProduit = useMemo(
    () => produits.find((produit) => produit.id === produitId) ?? null,
    [produits, produitId]
  );
  const selectedActivite = useMemo(
    () => activites.find((activite) => activite.id === activiteId) ?? null,
    [activites, activiteId]
  );

  const quantityLabel =
    categorie === "ACTIVITE" && selectedActivite
      ? `Quantité (${selectedActivite.prixParUnite})`
      : categorie === "CHAMBRE"
        ? "Quantité (nuitées / suppléments)"
        : categorie === "EVENEMENT"
          ? "Quantité (participants / unités)"
          : "Quantité";

  const unitPriceValue =
    categorie === "RESTAURANT" && selectedProduit
      ? selectedProduit.prix
      : categorie === "ACTIVITE" && selectedActivite
        ? selectedActivite.gratuit
          ? 0
          : selectedActivite.prix
        : categorie === "CHAMBRE" && reservation
          ? reservation.prixNuit
          : undefined;

  const descriptionPlaceholder =
    categorie === "RESTAURANT"
      ? "Sélectionnez un produit du menu"
      : categorie === "ACTIVITE"
        ? "Sélectionnez une activité"
        : categorie === "CHAMBRE" && reservation
          ? `Ex. Nuitée supplémentaire ${reservation.chambre}`
          : categorie === "EVENEMENT" && evenementTitre
            ? `Ex. Dépense liée à ${evenementTitre}`
            : "Ex. Nuitée chambre 12";

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input type="hidden" name="factureId" value={factureId} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Catégorie
          <select
            name="categorie"
            defaultValue="DIVERS"
            onChange={(event) => setCategorie(event.target.value)}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          >
            <option value="CHAMBRE">CHAMBRE</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="ACTIVITE">ACTIVITE</option>
            <option value="EVENEMENT">EVENEMENT</option>
            <option value="DIVERS">DIVERS</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Description *
          <input
            key={`description-${categorie}-${produitId}-${activiteId}`}
            name="description"
            required={categorie === "DIVERS" || categorie === "CHAMBRE" || categorie === "EVENEMENT"}
            placeholder={descriptionPlaceholder}
            defaultValue={
              categorie === "RESTAURANT" && selectedProduit
                ? selectedProduit.nom
                : categorie === "ACTIVITE" && selectedActivite
                  ? `${selectedActivite.nom} (${selectedActivite.prixParUnite})`
                  : categorie === "CHAMBRE" && reservation
                ? `Supplément séjour ${reservation.chambre}`
                : categorie === "EVENEMENT" && evenementTitre
                  ? `Dépense événement ${evenementTitre}`
                  : ""
            }
            readOnly={categorie === "RESTAURANT" || categorie === "ACTIVITE"}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
      </div>
      {categorie === "RESTAURANT" ? (
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Produit du menu
          <select
            name="produitId"
            required
            value={produitId}
            onChange={(event) => setProduitId(event.target.value)}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          >
            <option value="">Sélectionner un produit</option>
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom} • {produit.categorie}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {categorie === "ACTIVITE" ? (
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Activité
          <select
            name="activiteId"
            required
            value={activiteId}
            onChange={(event) => setActiviteId(event.target.value)}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)]"
          >
            <option value="">Sélectionner une activité</option>
            {activites.map((activite) => (
              <option key={activite.id} value={activite.id}>
                {activite.nom} • {activite.prixParUnite}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          {quantityLabel}
          <input
            key={`quantity-${categorie}-${activiteId}`}
            name="quantite"
            type="number"
            step="0.1"
            min={0.01}
            defaultValue={categorie === "CHAMBRE" && reservation ? reservation.nombreNuits : 1}
            inputMode="decimal"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Prix unitaire (XOF) *
          <input
            key={`price-${categorie}-${produitId}-${activiteId}`}
            name="prixUnitaire"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={unitPriceValue ?? ""}
            inputMode="decimal"
            readOnly={categorie === "RESTAURANT" || categorie === "ACTIVITE"}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
          Remise (XOF)
          <input
            name="remise"
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            aria-describedby="remise-help"
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--paper-2)] px-4 py-3 text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
          />
          <span id="remise-help" className="text-xs text-[color:var(--ink-muted)]">
            Laissez vide si aucune remise ne s&apos;applique.
          </span>
        </label>
      </div>

      <FormError message={state.error} />

      <SubmitButton
        label="Ajouter la consommation"
        loadingLabel="Ajout..."
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      />
    </form>
  );
}

