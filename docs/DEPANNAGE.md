# DEPANNAGE.md — Guide de dépannage et résolution d'incidents

15 problèmes réels rencontrés sur PharmaOptimus. Format : **Symptôme → Cause probable → Solution → Commande de vérification**.

---

## Problème 1 — Le site affiche "Aucune donnée" alors que Supabase est configuré

**Symptôme** : le tableau de bord est vide ou affiche "Aucune donnée" même si les variables d'environnement Supabase sont définies dans Vercel.

**Cause probable** : la clé `current_run_id` est absente de la table `app_config`. Le frontend ne peut pas identifier quel run afficher.

**Solution** : lancer (ou relancer) le pipeline GitHub Actions pour qu'il calcule et écrive `current_run_id` dans `app_config`.

1. GitHub → **Actions → Pipeline — calcul batch → Run workflow**.
2. Attendre la fin du job (< 15 min).
3. Recharger le frontend.

**Commande de vérification** :

```sql
-- Dans Supabase SQL Editor
SELECT key, value, updated_at FROM app_config WHERE key = 'current_run_id';
-- Attendu : une ligne avec un UUID récent
```

---

## Problème 2 — Pipeline : "Modèle factice détecté"

**Symptôme** : le pipeline GitHub Actions affiche l'erreur `Modèle factice détecté (XXXX octets < 10000)` et s'arrête.

**Cause probable** : le fichier `ml/models/demand_lightgbm_v1.joblib` est vide ou contient un objet placeholder. Un LightGBM réellement entraîné dépasse 10 000 octets.

**Solution** : relancer l'entraînement localement, vérifier le modèle, puis pousser le fichier sur GitHub.

```bash
# PowerShell
.venv\Scripts\Activate.ps1
python ml/train_and_export_model.py
python ml/scripts/verify_model.py
git add ml/models/demand_lightgbm_v1.joblib ml/models/demand_v1_metadata.json
git commit -m "fix: modèle LightGBM réel entraîné"
git push
```

**Commande de vérification** :

```powershell
# Vérifier la taille du fichier
(Get-Item ml/models/demand_lightgbm_v1.joblib).length
# Attendu : > 10000 octets
```

---

## Problème 3 — Erreur 401 Unauthorized sur toutes les routes Supabase

**Symptôme** : toutes les requêtes REST vers Supabase retournent `{"code":401,"message":"Unauthorized"}` ou `{"message":"Invalid API key"}`.

**Cause probable** : la clé `anon` utilisée par le frontend est incorrecte, expirée, ou les politiques RLS n'autorisent pas la lecture publique.

**Solution** :
1. Vérifier que `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Vercel correspond bien à la clé `anon / public` dans Supabase **Settings → API**.
2. Vérifier que les politiques `lecture_publique_*` existent sur les tables concernées.

```sql
-- Lister les politiques RLS actives
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
-- Chaque table doit avoir une politique 'for select using (true)'
```

**Commande de vérification** :

```bash
curl "<SUPABASE_URL>/rest/v1/facilities?select=name&limit=1" \
  -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
# Attendu : [{"name":"..."}]
```

---

## Problème 4 — `npm run build` échoue avec "Mode maquette actif"

**Symptôme** : le build Vercel ou local échoue avec un message du type `"ERREUR : Mode maquette actif en production"` ou similaire.

**Cause probable** : la variable d'environnement `NEXT_PUBLIC_USE_MOCKS=true` est définie dans Vercel pour l'environnement Production ou Preview.

**Solution** : retirer ou désactiver cette variable dans Vercel.

1. Vercel Dashboard → **Settings → Environment Variables**.
2. Trouver `NEXT_PUBLIC_USE_MOCKS`.
3. Supprimer la variable ou mettre sa valeur à `false`.
4. Redéclencher le déploiement.

**Commande de vérification** :

```bash
# Localement dans web/
cd web
NEXT_PUBLIC_USE_MOCKS=false npm run build
# Attendu : build terminé sans erreur
```

---

## Problème 5 — La carte ne charge pas les polygones de départements

**Symptôme** : la carte du Bénin s'affiche mais sans les polygones de frontières de départements (zones colorées absentes).

**Cause probable** : le fichier `data/raw/geoboundaries_benin_adm1.geojson` est introuvable ou son chemin est incorrect dans le code.

**Solution** :
1. Vérifier que le fichier existe :

```powershell
# PowerShell
Test-Path data/raw/geoboundaries_benin_adm1.geojson
# Attendu : True
```

2. Si absent, relancer le script de téléchargement des données :

```bash
python data/download_online_datasets.py
```

3. Si le fichier existe mais que la carte ne charge pas, vérifier dans la console du navigateur si une erreur 404 est émise sur ce fichier.

**Commande de vérification** :

```powershell
(Get-Item data/raw/geoboundaries_benin_adm1.geojson).length
# Attendu : > 1000 octets (un GeoJSON non vide)
```

---

## Problème 6 — La page Tournées est vide même avec des données

**Symptôme** : la page Tournées (`/tournees`) n'affiche aucun itinéraire alors que le pipeline a réussi.

**Cause probable** : le schéma SQL des tables `delivery_routes` ou `route_stops` est incompatible — colonnes `stop_order` ou `facility_id` absentes ou mal nommées.

**Solution** : vérifier que les migrations `0002_logistics.sql` et `0003_results.sql` ont bien été exécutées et que les tables ont la bonne structure.

**Commande de vérification** :

```sql
-- Vérifier les colonnes de delivery_routes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'delivery_routes';
-- Attendu : colonnes run_id, name, corridor_name, total_distance_km, etc.

-- Vérifier les colonnes de route_stops
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'route_stops';
-- Attendu : colonnes route_id, stop_order, facility_id, eta_s

-- Vérifier les données après le pipeline
SELECT count(*) FROM delivery_routes
WHERE run_id = (SELECT (value->>'run_id')::uuid FROM app_config WHERE key = 'current_run_id');
-- Attendu : > 0
```

---

## Problème 7 — Le modèle prédit des quantités négatives

**Symptôme** : des prévisions avec `q10`, `q50` ou `q90` négatifs apparaissent dans la table `forecasts`.

**Cause probable** : l'offset de calibration CQR (Conformalized Quantile Regression) est trop élevé ou mal calculé, produisant des quantiles inférieurs décalés en dessous de zéro.

**Solution** : recalibrer le modèle en relançant l'entraînement complet, puis vérifier les offsets.

```bash
# PowerShell
.venv\Scripts\Activate.ps1
python ml/train_and_export_model.py
python ml/scripts/verify_model.py
```

Le script `verify_model.py` vérifie que `q10 <= q50 <= q90` pour toutes les prédictions de test. Si la vérification échoue, le modèle n'est pas valide.

**Commande de vérification** :

```sql
-- Vérifier l'absence de valeurs négatives après pipeline
SELECT count(*) FROM forecasts WHERE q10 < 0 OR q50 < 0 OR q90 < 0;
-- Attendu : 0
```

---

## Problème 8 — `pytest test_simulator.py` échoue sur `test_stock_equation`

**Symptôme** : le test `test_stock_equation` dans `ml/tests/test_simulator.py` échoue avec une erreur d'assertion sur les données de stock.

**Cause probable** : les données simulées ont été générées avec une graine différente ou sont corrompues. Le test vérifie l'équation de stock stricte `stock_t+1 = stock_t + livraisons - dispensations`.

**Solution** : régénérer les données avec la graine fixée à 42.

```bash
# PowerShell
.venv\Scripts\Activate.ps1
python data/simulator/build_datasets.py
pytest ml/tests/test_simulator.py -v
```

**Commande de vérification** :

```powershell
# Vérifier que le fichier a bien été régénéré avec la bonne date
(Get-Item data/processed/historical_consumption_benin.csv).LastWriteTime
```

---

## Problème 9 — Vercel : erreur "Module not found"

**Symptôme** : le build Vercel échoue avec `Module not found: Can't resolve '...'` ou des erreurs d'imports manquants.

**Cause probable** : le **Root Directory** dans la configuration Vercel n'est pas défini à `web`. Vercel cherche alors `package.json` à la racine du dépôt au lieu de `web/package.json`.

**Solution** :
1. Vercel Dashboard → **Settings → General → Root Directory**.
2. Changer la valeur pour `web` (pas `.` ni la racine).
3. Sauvegarder et redéclencher le déploiement.

**Commande de vérification** :

```bash
# Vérifier localement que le build fonctionne depuis web/
cd web
npm ci
npm run build
# Attendu : build terminé sans erreur dans web/.next/
```

---

## Problème 10 — GitHub Actions : "SUPABASE_URL not set"

**Symptôme** : le pipeline GitHub Actions affiche `SUPABASE_URL not set` ou une erreur de connexion Supabase et s'arrête à l'étape "Exécuter le pipeline".

**Cause probable** : les secrets GitHub `SUPABASE_URL` et/ou `SUPABASE_SERVICE_ROLE_KEY` n'ont pas été créés.

**Solution** :
1. GitHub → dépôt → **Settings → Secrets and variables → Actions**.
2. Cliquer **New repository secret** pour chaque secret manquant :
   - `SUPABASE_URL` : URL du projet Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` : clé `service_role` Supabase.
3. Relancer le workflow.

**Commande de vérification** :

La liste des secrets est visible dans **Settings → Secrets and variables → Actions** (les valeurs sont masquées, seuls les noms sont affichés). Vérifier que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` apparaissent dans la liste.

---

## Problème 11 — Pipeline : VRP ne retourne aucune route

**Symptôme** : le pipeline se termine sans erreur mais la table `delivery_routes` reste vide ; le log affiche `VRP : aucune solution trouvée`.

**Cause probable** : le package `ortools` n'est pas installé dans l'environnement ou sa version est incompatible.

**Solution** :

```bash
# Vérifier la version installée
pip show ortools

# Installer la version exacte requise
pip install ortools==9.10.4067
```

Vérifier que `ortools==9.10.4067` est bien dans `ml/requirements.txt`, puis relancer le pipeline.

**Commande de vérification** :

```bash
python -c "import ortools; print(ortools.__version__)"
# Attendu : 9.10.4067
```

---

## Problème 12 — Le tableau de bord affiche des métriques MAQUETTE permanentes

**Symptôme** : la page Méthode (`/methode`) ou le tableau de bord affiche toujours les mêmes métriques statiques ou un badge "MAQUETTE" permanent, sans lien avec Supabase.

**Cause probable** : la table `model_metrics` est vide — `ml/evaluate.py` n'a pas été exécuté ou `metrics.json` n'a pas été chargé dans Supabase.

**Solution** :

```bash
# Calculer les métriques réelles
python ml/evaluate.py --split test --out ml/reports/metrics.json
```

Puis charger `metrics.json` dans Supabase :
- Ouvrir `ml/reports/metrics.json`.
- Dans Supabase SQL Editor, insérer les valeurs dans la table `model_metrics`.
- Ou relancer le pipeline complet qui se charge de cette étape.

**Commande de vérification** :

```sql
SELECT model_version, wape, mase, coverage_q10_q90, generated_at
FROM model_metrics
ORDER BY generated_at DESC
LIMIT 3;
-- Attendu : au moins une ligne avec des valeurs numériques réelles
```

---

## Problème 13 — Erreur CORS sur les routes API

**Symptôme** : la console du navigateur affiche une erreur `CORS policy: No 'Access-Control-Allow-Origin' header is present` sur les appels vers Supabase.

**Cause probable** : le domaine Vercel de production n'est pas dans la liste des origines autorisées dans la configuration Supabase.

**Solution** :
1. Supabase Dashboard → **Settings → API → Allowed Origins** (ou **Authentication → URL Configuration**).
2. Ajouter l'URL Vercel de production (ex. `https://pharmaoptimus-xxx.vercel.app`).
3. Sauvegarder.

**Commande de vérification** :

```bash
# Tester depuis un navigateur sur le domaine Vercel
# Ouvrir l'inspecteur → Réseau → chercher une requête vers supabase.co
# Vérifier que la réponse contient : Access-Control-Allow-Origin: https://pharmaoptimus-xxx.vercel.app
```

---

## Problème 14 — Le pipeline tourne plus de 15 minutes et est annulé par GitHub Actions

**Symptôme** : le workflow GitHub Actions est annulé automatiquement après 15 minutes avec le message `The job was canceled because "run-pipeline" exceeded the maximum execution time of 15 minutes`.

**Cause probable** : le solveur VRP est bloqué sur un problème trop grand, ou le volume de données est trop important pour le timeout configuré.

**Solution** : utiliser l'option `--only forecast` pour tester les étapes individuellement et identifier l'étape lente.

Dans le fichier `.github/workflows/pipeline.yml`, ou en ajoutant un input au workflow, passer l'argument `--only forecast` :

```bash
# Localement pour tester
python ml/run_pipeline.py --env supabase --only forecast
python ml/run_pipeline.py --env supabase --only transfers
python ml/run_pipeline.py --env supabase --only vrp
```

Si c'est le VRP qui bloque, vérifier le paramètre `time_limit_sec` dans `ml/src/optim/vrp_solver.py` (valeur par défaut : 10 secondes).

**Commande de vérification** :

```bash
# Mesurer la durée de chaque étape
time python ml/run_pipeline.py --env local --only forecast
```

---

## Problème 15 — `data/SOURCES.md` : une source est marquée "à vérifier"

**Symptôme** : dans `data/SOURCES.md`, le tableau des sources de données contient une ligne avec le statut "à vérifier" ou un lien mort.

**Cause probable** : la vérification de la source n'a pas été complétée lors de la phase de collecte des données.

**Solution** :
1. Ouvrir `data/SOURCES.md`.
2. Pour la ligne concernée, consulter l'URL officielle indiquée.
3. Vérifier que la donnée est toujours disponible et que la licence est compatible.
4. Mettre à jour le statut dans le tableau (ex. "Vérifié le AAAA-MM-JJ").
5. Committer la mise à jour.

**Commande de vérification** :

```bash
# Rechercher toutes les occurrences "à vérifier" dans SOURCES.md
grep -i "à vérifier" data/SOURCES.md
# Attendu : aucun résultat (toutes les sources vérifiées)
```
