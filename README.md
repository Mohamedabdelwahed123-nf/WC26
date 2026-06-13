# 🏆 Mondial 26 · Pronostics

Jeu **privé** de pronostics pour la **Coupe du Monde 2026** — entre amis. Chaque joueur
prédit le score exact de chaque match, marque des points, et grimpe au classement.

- **Next.js 14** (App Router) · **TypeScript** · **TailwindCSS** · primitives type shadcn/ui
- **Prisma** + **PostgreSQL** (Neon) · déployable sur **Vercel**
- Auth par identifiants (**NextAuth**) + **code d'invitation** obligatoire à l'inscription
- Calendrier complet (104 matchs) importé depuis [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
- Résultats **automatiques** (Cron Vercel toutes les 30 min) avec **saisie manuelle** de secours
- Thème inspiré de l'identité **noir / blanc / or** du Mondial 2026 (sans logo officiel ni trophée — droits réservés)

---

## 🎯 Règles de points (cumulatif, max 3 pts / match)

| Condition | Points |
| --- | --- |
| Bon résultat (1 / N / 2) | +1 |
| Bonne différence de buts | +1 |
| Score exact | +1 |

Exemples (score réel **2-1**) :

| Pronostic | Détail | Total |
| --- | --- | --- |
| `2-1` | résultat + différence + exact | **3** |
| `3-2` | résultat + différence | **2** |
| `3-0` | résultat seul | **1** |
| `0-1` | rien | **0** |

> Cas du nul : pour un nul réel (`1-1`), **tout** nul pronostiqué (`0-0`, `2-2`…) obtient
> le point de différence **et** le point de résultat → **2 pts**.

Le **classement** se départage par : points totaux → nombre de scores exacts → nombre de bons résultats.

---

## 🚀 Démarrage local

### 1. Prérequis

- Node.js 18.18+ (idéalement 20+)
- Une base PostgreSQL — gratuit avec [Neon](https://neon.tech)

### 2. Base de données Neon

1. Crée un projet sur [neon.tech](https://neon.tech).
2. Dans **Connection Details**, copie la chaîne **Pooled connection** (`...-pooler...`).
3. Garde-la pour `DATABASE_URL`.

### 3. Configuration

```bash
cp .env.example .env
```

Renseigne `.env` :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne Neon (pooled) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` en local |
| `INVITE_CODE` | Le code à partager à tes amis pour s'inscrire |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Ton compte admin (créé au seed) |
| `CRON_SECRET` | `openssl rand -base64 32` (protège le cron) |

### 4. Installation & base

```bash
npm install
npm run db:push     # crée les tables dans Neon
npm run db:seed     # crée l'admin + importe les 104 matchs
```

### 5. Lancer

```bash
npm run dev
```

→ http://localhost:3000 · connecte-toi avec ton compte admin.

---

## 👤 Inscription des amis

Partage-leur l'URL + le **`INVITE_CODE`**. À l'inscription, le code est vérifié
**côté serveur** : sans lui, impossible de créer un compte. Tout le monde est `PLAYER`,
sauf toi (`ADMIN`).

---

## 🛠️ Panneau admin (`/admin`)

- **Éditer un match** : renommer les placeholders de phase finale (`W101` → vrai pays),
  changer drapeaux, date, phase, groupe.
- **Saisir un score** : saisie manuelle → `manualOverride = true`, le cron ne réécrira
  plus ce match. Tu peux aussi **effacer** un résultat (ce qui lève l'override).
- **Synchroniser** : déclenche immédiatement la récupération des résultats depuis la source.
- **Nouveau match** : ajout manuel si besoin.

À chaque changement de score (cron **ou** admin), les points de **tous** les pronostics
du match sont **recalculés** (fonction idempotente).

---

## ⏱️ Verrouillage des pronostics

- Un pronostic se modifie **jusqu'au coup d'envoi**.
- Le verrou est **appliqué côté serveur** (`/api/predictions` rejette toute écriture après
  le coup d'envoi) — le client n'est jamais une source de vérité.
- **Anti-triche** : avant le coup d'envoi, on ne voit **pas** les pronostics des autres.
  Après le coup d'envoi, tous les pronostics du match deviennent visibles.

Toutes les dates sont stockées en **UTC** et affichées dans le fuseau **Tunisie (UTC+1)**.

---

## ☁️ Déploiement Vercel

1. Pousse le repo sur GitHub, puis **Import Project** sur [vercel.com](https://vercel.com).
2. Ajoute les variables d'environnement (les mêmes que `.env`), avec :
   - `NEXTAUTH_URL = https://<ton-app>.vercel.app`
   - `DATABASE_URL` = la chaîne Neon pooled
3. Déploie. La commande de build (`prisma generate && next build`) est déjà configurée.
4. Initialise la base **une fois** (depuis ta machine, avec le `DATABASE_URL` de prod) :

```bash
npm run db:push
npm run db:seed
```

### Cron des résultats

`vercel.json` déclare le cron :

```json
{
  "crons": [
    { "path": "/api/cron/fetch-results", "schedule": "0 12 * * *" }
  ]
}
```

- **Une fois par jour** (12:00 UTC) — c'est la limite du plan **Hobby** de Vercel ; une
  fréquence plus élevée (ex. toutes les 30 min) est **refusée au déploiement** sur Hobby.
- L'endpoint vérifie en plus la fenêtre exacte **11 juin → 19 juillet 2026** et ne fait rien en dehors.
- Vercel envoie automatiquement l'en-tête `Authorization: Bearer <CRON_SECRET>` ; l'endpoint
  le vérifie. Définis donc `CRON_SECRET` dans les variables Vercel.

> ⚠️ **Plan Vercel Hobby** : les crons ne peuvent tourner qu'**une fois par jour** (d'où
> `0 12 * * *`). Pour des mises à jour plus fréquentes (ex. toutes les 30 min pendant les
> matchs), deux options : passer au plan **Pro**, ou utiliser un **cron externe gratuit**
> (ex. [cron-job.org](https://cron-job.org)) qui appelle
> `https://<ton-app>.vercel.app/api/cron/fetch-results` toutes les 30 min avec l'en-tête
> `Authorization: Bearer <CRON_SECRET>`. La saisie manuelle des scores dans `/admin` reste
> toujours disponible.

### Robustesse du cron

L'endpoint **ne plante jamais** : source injoignable, JSON invalide, ou match introuvable
sont **journalisés et ignorés** ; les autres matchs sont quand même traités. La jointure
avec la source se fait par **index stable** (`sourceIndex`), insensible aux renommages
d'équipes et à l'ajout tardif des scores côté source.

---

## 🧪 Tests

```bash
npm test
```

Couvre la fonction de score : résultat / différence / score exact, et le cas limite du
**match nul** (tout nul pronostiqué pour un nul réel obtient le point de différence).

---

## 📁 Structure

```
prisma/
  schema.prisma        # User, Match, Prediction (unique userId+matchId), manualOverride
  seed.ts              # admin + import des 104 matchs
src/
  app/
    (app)/             # zone authentifiée : dashboard, matches, leaderboard, profile, admin
    login, register    # auth
    api/               # auth, register, predictions, admin/matches, cron/fetch-results
  components/          # UI (type shadcn) + composants applicatifs
  lib/
    scoring.ts         # barème (pur, testé)
    worldcup.ts        # fetch + parsing source openfootball
    results.ts         # application score + recalcul + sync cron
    standings.ts       # classement + départages
    teams.ts           # drapeaux emoji
    format.ts          # dates (UTC -> Tunisie), libellés de phase
```

---

## 📜 Sources & droits

Calendrier : [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
(domaine public). Aucun logo officiel FIFA ni image du trophée n'est utilisé — l'identité
visuelle (noir / blanc / or, motif « 26 ») est une réinterprétation libre.
