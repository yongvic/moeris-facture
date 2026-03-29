# Guide d’utilisation — Résidence Moeris

Ce document explique pas à pas comment utiliser la plateforme de gestion de la Résidence Moeris (réception, restaurant, activités, événements, facturation).

## 1. Accès et connexion

1. Ouvrez l’URL de la plateforme dans votre navigateur.
2. Cliquez sur **Connexion** si vous n’êtes pas redirigé automatiquement.
3. Saisissez les identifiants staff/administrateur fournis lors du déploiement.
4. Une fois connecté, vous arrivez sur le **Dashboard**.

Astuce : en cas d’échec, vérifiez la casse de l’email et du mot de passe.

## 2. Navigation générale

La barre latérale donne accès aux modules principaux :

- Dashboard
- Clients
- Factures
- Chambres
- Réservations
- Restaurant (POS)
- Menu (Restaurant)
- Activités
- Événements
- Analytics
- Admin

Chaque page a un bouton **Créer** ou **Nouveau** pour ajouter des données.

## 3. Clients (CRM)

Objectif : créer et consulter la fiche client.

1. Menu **Clients**.
2. Cliquez sur **Nouveau client**.
3. Renseignez au minimum le **Prénom**.
4. Enregistrez.

Conseils :
- Le **Segment** (STANDARD, VIP, PREMIUM) sert à prioriser le suivi.
- Les **Notes internes** sont visibles uniquement par l’équipe.

## 4. Chambres

Objectif : gérer l’inventaire des chambres.

1. Menu **Chambres**.
2. Cliquez sur **Nouvelle chambre**.
3. Renseignez numéro, type, capacité et prix.
4. Enregistrez.

Astuce : utilisez les équipements pour faciliter la vente (WiFi, climatisation, etc.).

## 5. Réservations

Objectif : créer, mettre à jour ou annuler une réservation.

1. Menu **Réservations**.
2. Cliquez sur **Nouvelle réservation**.
3. Sélectionnez un client, une chambre et les dates.
4. Enregistrez.

Règles importantes :
- La date de départ doit être après la date d’arrivée.
- La capacité de la chambre ne peut pas être dépassée.
- L’annulation se fait depuis la fiche de réservation.

## 6. Restaurant — POS (encaissement rapide)

Objectif : facturer rapidement des consommations restaurant.

1. Menu **Restaurant**.
2. Cliquez sur les produits pour remplir le panier.
3. Sélectionnez un client existant ou saisissez un **client rapide**.
4. Choisissez le mode de paiement.
5. Cliquez **Encaisser**.

Règles :
- Une référence est obligatoire pour **Virement** ou **Mobile Money**.
- Après encaissement, vous êtes redirigé vers la facture.

## 7. Menu Restaurant (Produits)

Objectif : gérer les produits servis au restaurant.

1. Menu **Menu**.
2. Cliquez sur **Nouveau produit**.
3. Renseignez nom, catégorie, prix et disponibilité.
4. Enregistrez.

Astuce : archivez un produit pour le retirer du POS sans le supprimer.

## 8. Factures

Objectif : regrouper consommations et paiements.

1. Menu **Factures**.
2. Cliquez **Nouvelle facture**.
3. Sélectionnez un client.
4. Enregistrez.

Sur la fiche facture :
- Ajoutez des **consommations** (chambre, restaurant, activité, événement, divers).
- Ajoutez des **paiements** (espèces, mobile money, carte, etc.).
- Téléchargez le **PDF** avec le logo.

Règles :
- La remise ne peut pas dépasser le sous-total.
- Le paiement ne peut pas dépasser le reste à payer.
- Facture annulée = encaissement interdit.

## 9. Activités

Objectif : gérer les activités proposées aux clients.

1. Menu **Activités**.
2. Cliquez sur **Nouvelle activité**.
3. Renseignez nom, prix, capacité et disponibilité.
4. Enregistrez.

Astuce : cochez **Gratuit** pour forcer le prix à 0.

## 10. Événements

Objectif : gérer les événements et leurs participants.

1. Menu **Événements**.
2. Cliquez sur **Nouvel événement**.
3. Renseignez les dates, capacités, tarifs (par participant ou forfait).
4. Enregistrez.

Sur la fiche événement :
- Ajoutez des participants.
- Suivez le statut de l’événement.

Règle : capacité max non dépassable.

## 11. Analytics

Objectif : suivre la performance.

Vous retrouvez :
- Revenu total
- Taux d’occupation
- Factures impayées
- Évolution mensuelle
- Top clients

## 12. Exports

Exports disponibles :
- **CSV clients** : `/api/exports/clients`
- **CSV factures** : `/api/exports/factures`

## 13. Bonnes pratiques

- Vérifiez toujours les montants avant encaissement.
- Renseignez une référence pour les paiements non-cash.
- Annulez une réservation plutôt que de supprimer.
- Archivez un produit plutôt que de le supprimer.

## 14. Support

Si vous rencontrez un blocage :
1. Rafraîchissez la page.
2. Vérifiez votre connexion internet.
3. Contactez l’administrateur de la plateforme.
