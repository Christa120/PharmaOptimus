# DEPLOIEMENT.md — Guide de déploiement PharmaOptimus

À l'attention du chef de projet. Pour chaque étape : **Où** → **Action** → **Résultat attendu** → **Comment vérifier** → **Que faire si ça échoue**.

---

## Section 1 — Logiciels à installer

| Logiciel | Version requise | URL de téléchargement | Commande de vérification | Résultat attendu |
|---|---|---|---|---|
| Git | Récente (≥ 2.40) | https://git-scm.com/downloads | `git --version` | `git version 2.4x.x` |
| Node.js | LTS 20.17.0 (fichier `.nvmrc`) | https://nodejs.org/en/download | `node -v` | `v20.17.0` |
| Python | 3.11.x | https://www.python.org/downloads/release/python-3110/ | `python --version` | `Python 3.11.x` |
| VS Code | Récente | https://code.visualstudio.com/ | `code --version` | Numéro de version s'affiche |

**Où** : votre poste local.

**Comment vérifier** : ouvrir un terminal et lancer les commandes ci-dessus.

**Que faire si ça échoue** : relancer l'installeur depuis l'URL officielle ; sous Windows vérifier que le binaire est bien dans le PATH (Paramètres système → Variables d'environnement).

---

## Section 2 — Comptes à créer

| Service | URL | Plan gratuit | Vérification CB | Où noter les identifiants |
|---|---|---|---|---|
| GitHub | https://github.com/join | Free (illimité pour projets publics) | Aucune CB demandée | Gestionnaire de mots de passe local |
| Vercel | https://vercel.com/signup (connexion GitHub) | Hobby (gratuit) | Aucune CB demandée | Gestionnaire de mots de passe local |
| Supabase | https://supabase.com/dashboard/sign-up | Free tier (500 MB, 2 projets) | Aucune CB demandée | Gestionnaire de mots de passe local |
| Google | https://accounts.google.com/signup | Gratuit (Colab + Drive inclus) | Aucune CB demandée | Gestionnaire de mots de passe local |

> **Important** : ne jamais stocker les clés dans un fichier versionné. Utiliser un gestionnaire de mots de passe (Bitwarden, 1Password, etc.) ou un fichier `.env` exclu du dépôt par `.gitignore`.

---

## Section 3 — Environnements de travail

| Environnement | Rôle | Activation / Accès | Notes |
|---|---|---|---|
| Python local (`.venv`) | Entraîner le modèle, lancer le pipeline localement | **PowerShell** : `.venv\Scripts\Activate.ps1` — **macOS/Linux** : `source .venv/bin/activate` | Créer avec `python -m venv .venv` |
| Node.js local (`web/`) | Développer et tester le frontend Next.js | `cd web && npm ci` | Requires Node 20.17.0 |
| Google Colab | Exploration, entraînement GPU/CPU dans le cloud | Ouvrir https://colab.research.google.com | Voir `docs/COLAB.md` |
| GitHub Actions | Pipeline batch hebdomadaire automatisé | Onglet **Actions** du dépôt GitHub | Déclenché manuellement ou via `cron` |
| Vercel | Hébergement et déploiement continu du frontend | https://vercel.com/dashboard | Déploiement auto sur push `main` |
| Supabase | Base de données PostgreSQL + API REST | https://supabase.com/dashboard | URL et clés dans les secrets |

---

## Section 4 — Envoyer le code sur GitHub

**Où** : terminal à la racine du projet.

### PowerShell (Windows)

```powershell
git init
git add .
git commit -m "feat: initial commit PharmaOptimus"
git branch -M main
git remote add origin https://github.com/<VOTRE_COMPTE>/<VOTRE_DEPOT>.git
git push -u origin main
```

### macOS / Linux

```bash
git init
git add .
git commit -m "feat: initial commit PharmaOptimus"
git branch -M main
git remote add origin https://github.com/<VOTRE_COMPTE>/<VOTRE_DEPOT>.git
git push -u origin main
```

**Résultat attendu** : le dépôt apparaît sur GitHub avec tous les fichiers du projet.

**Comment vérifier** : sur GitHub → onglet **Code** → vérifier que `.env` et `.env.local` **n'apparaissent pas** dans la liste des fichiers (ils doivent être exclus par `.gitignore`).

**Que faire si ça échoue** :
- Erreur d'authentification → configurer un Personal Access Token (PAT) ou SSH key sur GitHub.
- `.env` visible dans le dépôt → exécuter `git rm --cached .env` puis recommitter.

---

## Section 5 — Supabase

### 5.1 Créer le projet

**Où** : https://supabase.com/dashboard

1. Cliquer **New project**.
2. Choisir l'organisation, donner un nom (ex. `pharmaoptimus`).
3. Choisir la région **West EU (Ireland)** ou **South Africa (Cape Town)** selon la proximité.
4. Définir un mot de passe de base de données fort — noter le dans le gestionnaire de mots de passe.
5. Cliquer **Create new project** (démarrage ~2 min).

### 5.2 Exécuter les migrations dans l'ordre

**Où** : Supabase Dashboard → **SQL Editor**

Exécuter les fichiers dans cet ordre exact :

```
1. supabase/migrations/0001_core.sql
2. supabase/migrations/0002_logistics.sql
3. supabase/migrations/0003_results.sql
```

Copier le contenu de chaque fichier dans l'éditeur SQL et cliquer **Run**.

**Résultat attendu** : chaque script s'exécute sans erreur, les tables apparaissent dans **Table Editor**.

**Comment vérifier RLS** : dans **Table Editor**, chaque table doit afficher un cadenas **vert** indiquant que la Row Level Security est activée.

**Que faire si ça échoue** : si une migration échoue à cause d'une table existante, supprimer le projet Supabase, en recréer un, et relancer les migrations dans l'ordre depuis le début.

### 5.3 Relever URL et clés

**Où** : Supabase Dashboard → **Settings → API**

- `SUPABASE_URL` : colonne *Project URL*
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : clé *anon / public*
- `SUPABASE_SERVICE_ROLE_KEY` : clé *service_role* — **ne jamais exposer côté client**

### 5.4 Contrôle curl

Une fois les données chargées (Section 6), vérifier l'accès public :

```bash
curl "<SUPABASE_URL>/rest/v1/facilities?select=name&limit=3" \
  -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
```

**Résultat attendu** : 3 noms d'établissements en JSON, ex. `[{"name":"CNHU de Cotonou"},{"name":"CHU-MEL"},{"name":"CS Calavi"}]`.

**Que faire si ça échoue** : vérifier que la politique RLS `lecture_publique_facilities` existe dans **Authentication → Policies**.

---

## Section 6 — Charger les données

**Où** : terminal à la racine du projet, environnement `.venv` activé.

### PowerShell (Windows)

```powershell
.venv\Scripts\Activate.ps1
pip install -r ml/requirements.txt
python data/simulator/build_datasets.py
python ml/train_and_export_model.py
python ml/scripts/verify_model.py
```

### macOS / Linux

```bash
source .venv/bin/activate
pip install -r ml/requirements.txt
python data/simulator/build_datasets.py
python ml/train_and_export_model.py
python ml/scripts/verify_model.py
```

### Fichiers et lignes attendus

| Fichier | Lignes attendues | Description |
|---|---|---|
| `data/geo/reseau_pilote_benin.csv` | 54 | Établissements du réseau pilote |
| `data/processed/historical_consumption_benin.csv` | ~151 200 | 140 semaines × 54 fac × 20 produits |
| `data/processed/ground_truth.csv` | ~151 200 | Demande latente non censurée |
| `data/processed/weather_chirps_benin.csv` | ~140 | Séries climatiques hebdomadaires |
| `ml/models/demand_lightgbm_v1.joblib` | > 10 Ko | Modèle LightGBM entraîné |

**Résultat attendu de `verify_model.py`** : affichage `CONTRÔLE RÉUSSI — modèle réel chargé.`

### Commandes de vérification SQL (Supabase SQL Editor)

```sql
-- Vérifier le nombre d'établissements
SELECT count(*) FROM facilities;
-- Attendu : 54

-- Vérifier l'historique de consommation
SELECT count(*) FROM consumption_weekly;
-- Attendu : > 100 000 lignes

-- Vérifier que current_run_id est défini après le pipeline
SELECT value FROM app_config WHERE key = 'current_run_id';
-- Attendu : un UUID (après avoir lancé le pipeline)
```

**Que faire si ça échoue** : voir `docs/DEPANNAGE.md` problèmes 2, 8.

---

## Section 7 — Google Colab

Se référer à `docs/COLAB.md` pour la procédure complète d'entraînement sur Google Colab.

---

## Section 8 — Secrets GitHub et pipeline

**Où** : dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Créer les deux secrets suivants :

| Nom du secret | Valeur |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase (ex. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé `service_role` relevée en Section 5.3 |

### Lancer le workflow manuellement

1. Aller dans l'onglet **Actions** du dépôt.
2. Cliquer sur **Pipeline — calcul batch (prévisions, risques, tournées)**.
3. Cliquer **Run workflow** → laisser `advance_week = false` → **Run workflow**.

**Résultat attendu** : le workflow passe au vert en moins de 15 minutes.

**Comment vérifier** :

```sql
-- Dans Supabase SQL Editor
SELECT run_id, status, finished_at FROM pipeline_runs ORDER BY started_at DESC LIMIT 3;
-- La dernière ligne doit afficher status = 'success'
```

**Que faire si ça échoue** : voir `docs/DEPANNAGE.md` problèmes 10, 11.

---

## Section 9 — Vercel

**Où** : https://vercel.com/dashboard

1. Cliquer **Add New → Project**.
2. Cliquer **Import** sur le dépôt GitHub PharmaOptimus.
3. Dans **Configure Project** :
   - **Root Directory** : `web` (pas la racine du dépôt)
   - **Framework Preset** : Next.js (détecté automatiquement)
4. Dans **Environment Variables**, ajouter pour **Production** ET **Preview** :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase (ex. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé `anon / public` Supabase |

> **Important** : les variables `VITE_*` n'existent plus dans ce projet. Le frontend utilise Next.js avec les variables `NEXT_PUBLIC_*`. Ne jamais ajouter `SUPABASE_SERVICE_ROLE_KEY` comme variable Vercel publique.

5. Cliquer **Deploy**.

**Résultat attendu** : le build se termine avec succès, Vercel fournit une URL de type `https://pharmaoptimus-xxx.vercel.app`.

**Comment vérifier** : ouvrir l'URL Vercel dans le navigateur — la page d'accueil PharmaOptimus doit s'afficher avec le bandeau "Données simulées".

**Que faire si ça échoue** : voir `docs/DEPANNAGE.md` problèmes 4, 9.

---

## Section 10 — Vérifications finales (10 contrôles)

Effectuer ces vérifications dans l'ordre sur l'URL Vercel de production.

1. **Page d'accueil chargée** — Résultat attendu : la page `/` s'affiche en moins de 3 secondes, sans erreur console.
2. **Bandeau "données simulées" visible** — Résultat attendu : un bandeau ou badge indiquant que les données sont simulées est affiché sur l'interface.
3. **Carte affichée** — Résultat attendu : la carte du Bénin s'affiche avec les polygones de départements et les marqueurs d'établissements.
4. **Tableau de bord rempli** — Résultat attendu : le tableau de bord affiche des métriques (couverture, alertes, scores de priorité) issues de Supabase, pas des données maquette.
5. **Fiche établissement ouverte** — Résultat attendu : cliquer sur un marqueur ouvre un tiroir latéral avec le nom, le type, les jours de couverture et les prévisions de l'établissement.
6. **Recommandation acceptée + refusée avec motif** — Résultat attendu : dans la vue Transferts, accepter une recommandation met son statut à `accepted` ; la refuser demande un motif et met son statut à `rejected`.
7. **Tournées affichées** — Résultat attendu : la page Tournées affiche les routes VRP avec noms des corridors, distances et établissements à visiter.
8. **Métriques du modèle visibles** — Résultat attendu : la page Méthode (`/methode`) affiche les métriques WAPE, MASE et la couverture des intervalles issues de `model_metrics`.
9. **Avance d'une semaine** — Résultat attendu : lancer le pipeline avec `advance_week = true` (Section 8), puis recharger le tableau de bord — les dates de prévision avancent d'une semaine.
10. **Aucune clé de service dans les sources de la page** — Résultat attendu : ouvrir l'inspecteur du navigateur → onglet Sources → rechercher `service_role` — aucun résultat ne doit apparaître.

---

## Section 11 — Mise à jour et retour arrière

### Redéployer après un push

Pousser sur la branche `main` déclenche automatiquement un nouveau déploiement Vercel. Pour suivre l'avancement : Vercel Dashboard → onglet **Deployments**.

### Revenir à un déploiement précédent dans Vercel

1. Vercel Dashboard → **Deployments**.
2. Trouver le déploiement cible → cliquer les **`...`** → **Promote to Production**.

### Restaurer la base depuis un export SQL

```sql
-- Dans Supabase SQL Editor : importer le fichier .sql exporté
-- Ou via pg_dump / psql en ligne de commande :
psql "<SUPABASE_DB_URL>" < backup_AAAA-MM-JJ.sql
```

Si la base est vide, réexécuter les migrations dans l'ordre (Section 5.2) puis recharger les données (Section 6).

### Revenir à une version précédente du modèle

1. Identifier le commit Git contenant l'ancienne version de `ml/models/demand_lightgbm_v1.joblib`.
2. Extraire le fichier : `git show <HASH>:ml/models/demand_lightgbm_v1.joblib > ml/models/demand_lightgbm_v1.joblib`
3. Vérifier avec `python ml/scripts/verify_model.py`.
4. Relancer le pipeline (Section 8).

---

## Section 12 — Problèmes fréquents

Se référer à `docs/DEPANNAGE.md` pour la liste complète des 15 problèmes réels avec leurs solutions.
