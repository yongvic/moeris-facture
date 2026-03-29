# Résidence Moeris — Plateforme de Gestion Multiservice

SaaS de gestion hôtelière pour centraliser CRM, facturation, consommations, chambres, restaurant, activités et événements.

## Modules

- CRM clients
- Facturation, consommations, paiements
- Chambres et réservations
- Restaurant POS + menu
- Activités
- Événements + participants
- Analytics
- Exports CSV
- PDF factures avec logo

## Stack

- Next.js App Router
- Prisma v7 + PostgreSQL (Neon)
- Auth.js Credentials + RBAC
- @react-pdf/renderer pour PDF
- Tailwind CSS v4

## Démarrage local

1. Installer les dépendances

```bash
npm install
```

2. Configurer l’environnement

```bash
copy .env.example .env
```

3. Générer Prisma et pousser le schéma

```bash
npm run prisma:generate
npm run prisma:push
```

4. Seed admin

```bash
npm run db:seed
```

5. Lancer le projet

```bash
npm run dev
```

## Auth & Rôles

- ADMIN: accès complet
- MANAGER: accès complet sans gestion utilisateurs
- STAFF: création et lecture, pas d’annulation

Identifiants admin initialisés via `.env`.

## Exports

- Clients CSV: `/api/exports/clients`
- Factures CSV: `/api/exports/factures`

## PDF Factures

La facture PDF est disponible sur `/api/factures/[id]/pdf` 

## Variables d’environnement

Voir `.env.example` pour la liste complète.

## Scripts utiles

```bash
npm run prisma:generate
npm run prisma:push
npm run db:seed
npm run dev
```
