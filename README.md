# PharmaBénin : Plateforme Intelligente de Gestion & Résilience Pharmaceutique

## ⚠️ ÉTAT DU PROJET — À LIRE AVANT TOUTE CHOSE

### Ce qui est opérationnel
- ✅ Simulateur de données : 54 établissements × 20 produits × 140 semaines
- ✅ Solveurs d'optimisation : transferts (PuLP) et tournées (OR-Tools)
- ✅ Structure de base de données et migrations SQL
- ✅ Frontend Next.js (dossier `web/`) — requiert un `npm install` et variables Supabase

### Ce qui nécessite une exécution préalable
- ⚙️ Modèle ML LightGBM : exécuter `python ml/train_and_export_model.py` (quelques minutes, CPU suffisant)
- ⚙️ Métriques d'évaluation : exécuter `python ml/evaluate.py` après l'entraînement
- ⚙️ Pipeline complet : exécuter `python ml/run_pipeline.py --env local --dry-run` pour tester

### Avertissement sur les données
⚠️ Ce projet utilise exclusivement des données simulées. Le modèle ML porte le statut `validated_on_simulated_data`. Il n'a pas été validé sur des données réelles de dispensation.

### Étapes pour démarrer
1. `cp .env.example .env` puis remplir les variables Supabase
2. `pip install -r ml/requirements.txt`
3. `python data/simulator/build_datasets.py` (génère les données)
4. `python ml/train_and_export_model.py` (entraîne le modèle)
5. `python ml/scripts/verify_model.py` (vérifie le modèle)
6. `python ml/run_pipeline.py --env local --dry-run` (teste le pipeline)
7. Frontend : `cd web && npm install && cp .env.example .env.local && npm run dev`

---

## 1. Vision et Justification du Projet

La gestion de la chaîne d'approvisionnement des produits de santé constitue un enjeu vital pour la santé publique en République du Bénin. Dans de nombreuses zones sanitaires, les hôpitaux de référence, centres de santé communaux et officines font face à des ruptures récurrentes de médicaments essentiels d'un côté, et à des gaspillages évitables liés à des péremptions en surstock de l'autre. Ces dysfonctionnements proviennent souvent d'une absence d'anticipation des variations saisonnières de la demande, d'un manque de coordination entre structures voisines et de circuits de distribution peu optimisés depuis le dépôt central national.

**PharmaBénin** a été conçu pour apporter une réponse technologique, mathématique et opérationnelle à cette problématique. En s'appuyant sur des modèles prédictifs quantiles, la programmation linéaire pour la régulation horizontale des stocks et la résolution algorithmique des tournées de véhicules (Vehicle Routing Problem), la plateforme transforme les données de consommation et de transport en décisions de réapprovisionnement proactives, transparentes et auditables.

L'application est entièrement responsive. Elle a été pensée pour être utilisable aussi bien sur des postes fixes de gestionnaires de dépôt que sur des tablettes ou smartphones d'agents logistiques en déplacement dans les communes du Bénin.

---

## 2. Représentation Géographique Réelle du Territoire Béninois

La plateforme intègre une cartographie vectorielle fidèle à la morphologie et à l'organisation administrative de la République du Bénin.

### 2.1 Les 12 Départements et Agglomérations Couvertes
La cartographie prend en compte l'intégralité des 12 départements du pays, avec leurs chefs-lieux et leurs centres hospitaliers respectifs :
- **Littoral** : Cotonou, capitale économique, abritant le Dépôt Central Pharmaceutique National ainsi que le Centre National Hospitalier Universitaire Hubert Koutoukou Maga (CNHU-HKM) et le CHU Mère-Enfant Lagune (CHU-MEL).
- **Atlantique** : Abomey-Calavi (carrefour à forte croissance démographique), Allada et Ouidah.
- **Ouémé** : Porto-Novo, capitale officielle de la République, et les communes environnantes comme Sèmè-Kpodji, Dangbo et les Aguégués.
- **Plateau** : Pobè, Sakété et Kétou.
- **Zou** : Bohicon (carrefour commercial et logistique central) et Abomey.
- **Collines** : Dassa-Zoumè, Savalou, Savè et Bantè.
- **Mono** : Lokossa, Comè et Grand-Popo.
- **Couffo** : Aplahoué et Dogbo.
- **Borgou** : Parakou (pôle métropolitain du Nord) et Bembèrèkè.
- **Donga** : Djougou et Bassila.
- **Atacora** : Natitingou, Tanguiéta (Hôpital Saint-Jean de Dieu) et Boukoumbé.
- **Alibori** : Kandi, Malanville (extrême Nord, frontière du Niger) et Banikoara.

### 2.2 Zoom Urbain et Quartiers du Grand Nokoué
Pour refléter la densité médicale des pôles urbains majeurs, la carte propose un mode de zoom spécifique sur le Grand Nokoué qui individualise les principaux quartiers de Cotonou et d'Abomey-Calavi : Akpakpa (zone portuaire du dépôt), Ganhi (pôle d'affaires et officinal), Cadjèhoun, Haie Vive, Fidjrossè, Gbégamey, Jéricho, Zogbo, Agla, Houéyiho, Saint-Michel, Godomey, Togba et Akassato.

### 2.3 Réseau Routier et Corridors Nationaux
Les calculs d'itinéraires et de distances routières s'appuient sur les axes stratégiques du pays :
- La **RNIE 1** (Route Nationale Inter-États 1), assurant la liaison côtière d'Ouest en Est de Grand-Popo à Sèmè-Kpodji via Ouidah et Cotonou.
- La **RNIE 2**, véritable colonne vertébrale logistique Nord-Sud, reliant Cotonou à Malanville sur plus de 740 kilomètres via Bohicon, Parakou et Kandi.
- La **RNIE 3**, reliant le centre aux départements de la Donga et de l'Atacora via Savalou, Djougou et Natitingou.
- Les **pistes rurales latéritiques** d'accès difficile (notamment dans la chaîne de l'Atacora vers Boukoumbé ou dans les zones insulaires des Aguégués), identifiées par des vitesses moyennes réduites et un coefficient de ralentissement pluviométrique.

---

## 3. Éthique des Données et Règle d'Or `is_simulated = true`

Afin de respecter une stricte déontologie scientifique et de ne jamais induire en erreur les utilisateurs institutionnels ou les partenaires, la plateforme repose sur une distinction claire en trois couches :

1. **La Couche Réelle (Sourcée)** : Elle regroupe les limites administratives officielles (geoBoundaries et OCHA HDX), les coordonnées géographiques réelles des formations sanitaires et officines extraites d'OpenStreetMap et de healthsites.io, le réseau routier, les séries pluviométriques et thermiques historiques (CHIRPS et Open-Meteo) ainsi que la liste modèle OMS des médicaments essentiels.
2. **La Couche Calibrée** : Elle applique les ratios épidémiologiques et de consommation documentés dans les publications de santé publique au Bénin. Cela concerne notamment la saisonnalité du paludisme (bimodale au Sud et unimodale au Nord), l'impact des poussières de l'Harmattan sur les affections respiratoires ainsi que les délais d'importation maritime au Port de Cotonou.
3. **La Couche Simulée** : Les niveaux de stocks journaliers, les dispensations aux patients, les numéros de lots et les commandes sont générés par un simulateur stochastique fondé sur des lois binomiales négatives. Chaque enregistrement porte explicitement le marqueur technique `is_simulated = true`, évitant toute confusion avec des données cliniques nominatives.

### 3.1 Téléchargement Automatisé des Données Officielles en Ligne

Le script dédié `data/download_online_datasets.py` assure l'extraction directe des données ouvertes officielles depuis les API et référentiels institutionnels vers le dossier `data/raw/` :
- **geoBoundaries Bénin ADM1 GeoJSON** (`data/raw/geoboundaries_benin_adm1.geojson` - 61,9 Ko) : Tracé vectoriel officiel et certifié des 12 départements de la République du Bénin depuis le projet mondial geoBoundaries (William & Mary GeoLab).
- **Archives Climatiques Réelles Open-Meteo** (`data/raw/openmeteo_climate_benin.json` - 228,0 Ko) : Relevés journaliers réels de précipitations et de températures sur 731 jours (2023-2024) pour 5 stations témoins stratégiques (Cotonou Littoral, Bohicon Zou, Parakou Borgou, Natitingou Atacora, Kandi Alibori).
- **Formations Sanitaires Réelles OpenStreetMap** (`data/raw/osm_benin_health_facilities.json` - 20,6 Ko) : 100 structures sanitaires, hôpitaux, centres communaux et pharmacies réels extraits via l'API Overpass dans la boîte englobante géographique du Bénin ($6{,}18^\circ$ à $12{,}45^\circ\text{N}$, $0{,}70^\circ$ à $3{,}90^\circ\text{E}$).
- **Liste Modèle OMS des Médicaments Essentiels** (`data/raw/who_essential_medicines.json` - 11,8 Ko) : Base de référence internationale des principes actifs essentiels, de leur criticité clinique et de leurs impératifs de chaîne du froid.

L'exécution de la commande `python3 data/download_online_datasets.py` consigne l'ensemble des horodatages et des empreintes cryptographiques SHA-256 dans le journal d'audit `data/download_report.md`.

---

## 4. Architecture Mathématique et Logique Métier

### 4.1 Prévision de la Demande Quantile
Les besoins hebdomadaires ne sont pas estimés par une simple moyenne, mais par un modèle d'apprentissage supervisé global (LightGBM à fonction de perte Tweedie) complété par une régression quantile conforme (Conformal Quantile Regression - CQR). Cette approche fournit trois horizons :
- **q10** : Scénario plancher optimiste.
- **q50** : Prévision médiane centrale servant au dimensionnement régulier.
- **q90** : Scénario stress test permettant de sécuriser le stock de sécurité face à une flambée imprévue.
Le modèle intègre la variable `stockout_days` pour corriger le biais de censure : un jour de rupture n'est pas interprété à tort comme une baisse de morbidité.

### 4.2 Score de Priorité d'Intervention des Établissements
Chaque formation sanitaire se voit attribuer un score de priorité calculé sur une échelle transparente de 0 à 100 points :
$$\text{Score} = 100 \times (0.40 \cdot R + 0.25 \cdot C + 0.20 \cdot P + 0.15 \cdot T)$$
- **R (Risque de Rupture)** : Évalue l'imminence d'une rupture sous 7 à 14 jours.
- **C (Criticité Clinique)** : Proportion de produits vitaux (antipaludiques, ocytocine, sérums antivenimeux, insuline) concernés par la tension.
- **P (Population Desservie)** : Logarithme normalisé du bassin de population dépendant de la structure.
- **T (Temps Écoulé)** : Nombre de jours sans livraison depuis la dernière rotation du dépôt central.

### 4.3 Optimisation des Transferts Inter-Sites (PLNE)
Lorsqu'un établissement se trouve en surplus (> 60 jours de couverture) et qu'une structure voisine fait face à une rupture imminente (< 7 jours), le moteur formule un problème de programmation linéaire en nombres entiers pour calculer les quantités à déplacer. Les contraintes vérifient rigoureusement que :
- L'établissement expéditeur conserve un stock de sécurité minimal.
- Les produits thermosensibles (vaccins, ocytocine, insuline) ne sont transférés qu'entre structures disposant d'une chaîne du froid certifiée.
- La date de péremption des lots dépasse largement le temps de transport calculé.
L'utilisateur peut valider ou refuser chaque proposition, tout refus exigeant la saisie d'un motif consigné en base.

### 4.4 Tournées de Livraison VRP (Vehicle Routing Problem)
Depuis le Dépôt Central de Cotonou, l'algorithme planifie les rotations de la flotte (camions frigorifiques de 6 000 L, camions de fret sec de 12 000 L et camionnettes rapides de 2 500 L) en minimisant la distance totale parcourue et en respectant les durées de service des chauffeurs. Trois corridors majeurs sont desservis séquentiellement : le Sud-Lagunaire, l'Épine Dorsale Centrale et le Grand Nord.

### 4.5 Simulateur de Crise "Et Si ?" (What-If)
Le simulateur permet aux décideurs d'injecter des chocs exogènes majeurs (épidémie de paludisme dans le Nord, retard de conteneurs au Port de Cotonou, coupure de piste par inondation dans l'Atacora, panne frigorifique) et de comparer, via des simulations Monte Carlo à 200 itérations, la performance d'une politique classique à seuil fixe face à la politique proactive de PharmaBénin.

---

## 5. Guide Opérationnel des Actions par Plateforme

Cette section décrit de manière détaillée et narrative l'ensemble des démarches nécessaires pour déployer et maintenir l'écosystème technique sur les différentes infrastructures cloud gratuites.

### 5.1 Actions à mener sur Google Colab

Google Colab sert d'environnement d'entraînement hors ligne et d'expérimentation pour l'équipe Modélisation et Données. Aucune tâche lourde de calcul de gradient ne doit tourner sur le serveur web de production.

1. **Préparation de l'espace de travail** : Ouvrez un notebook Colab connecté à un runtime Python 3.11 gratuit. Montez votre compte Google Drive afin de stocker les jeux de données volumineux au format Parquet (`data/processed/`), qui ne doivent pas être déposés directement dans GitHub pour ne pas saturer l'espace de versionnage.
2. **Installation des dépendances** : Exécutez l'installation des bibliothèques scientifiques spécialisées via `pip install -r ml/requirements-colab.txt`, contenant notamment `lightgbm`, `statsforecast`, `optuna`, `pulp`, `ortools`, `pyarrow` et `scikit-learn`.
3. **Exécution séquentielle des notebooks de recherche** :
   - Le notebook `01_exploration.ipynb` permet d'analyser la structure des données de dispensation, d'identifier les zéros et de caractériser la censure causée par les jours de rupture.
   - Le notebook `02_saisonnalite.ipynb` calcule la corrélation croisée entre les séries de pluviométrie CHIRPS et les pics de consommation d'antipaludiques avec un retard de 3 à 6 semaines.
   - Les notebooks `03_baselines.ipynb` et `04_modeles.ipynb` entraînent les modèles de référence (Croston, AutoETS, moyenne mobile) puis le modèle LightGBM Tweedie multi-séries en utilisant une validation temporelle glissante (rolling origin) à 4 plis.
   - Le notebook `05_intervalles.ipynb` applique la régression quantile conforme (CQR) pour ajuster les largeurs d'intervalles [q10, q90] et certifier une couverture empirique de 80%.
4. **Sérialisation et export des artefacts** : Une fois les hyperparamètres figés et les tests d'ablation validés, exportez le modèle finalisé au format `joblib` sous le chemin `ml/models/demand_lightgbm_v1.joblib`, accompagné de son fichier d'audit `demand_v1_metadata.json` consignant le commit git, la graine aléatoire, la somme de contrôle des données et les métriques de validation. Ces artefacts sont ensuite poussés sur le dépôt GitHub.

### 5.2 Actions à mener sur Supabase (Base de Données PostgreSQL & Sécurité RLS)

Supabase assure le stockage relationnel centralisé et l'exposition d'une API sécurisée par jetons JWT.

1. **Création du projet** : Créez un projet gratuit sur [Supabase](https://supabase.com). Choisissez une région proche de l'Afrique de l'Ouest (par exemple `eu-west-1` ou `eu-west-3`) pour minimiser la latence réseau.
2. **Exécution des migrations SQL** :
   - Rendez-vous dans l'onglet **SQL Editor** de l'interface Supabase.
   - Exécutez dans l'ordre chronologique les scripts de migration situés dans `supabase/migrations/` :
     - `0001_core.sql` crée les tables géographiques (`geo_areas`), les structures sanitaires (`facilities`), les médicaments traceurs (`products`), la table de consommation hebdomadaire (`consumption_weekly`) et les prévisions quantiles (`forecasts`).
     - `0002_logistics.sql` génère les tables de stocks (`stock_weekly`), de lots (`lots`), de transferts inter-établissements (`transfer_recommendations`), de tournées de livraison (`delivery_routes`), de matrice routière (`travel_matrix`) et de scénarios de crise (`scenarios`).
3. **Activation impérative de la Row Level Security (RLS)** :
   - Toutes les tables de la base de données doivent avoir la commande `alter table [nom_table] enable row level security;` activée.
   - Pour la consultation publique ou démonstrative, créez des politiques de lecture ouverte uniquement sur les données de démonstration (`create policy "lecture_publique" on facilities for select using (true);`).
   - Aucune politique d'écriture directe depuis le navigateur n'est autorisée. Seuls les scripts serveurs authentifiés par la clé de service (`service_role`) ou les routes d'API contrôlées possèdent les droits d'insertion (`insert`) et de mise à jour (`update`).
4. **Récupération des clés d'accès** : Notez dans votre gestionnaire de clés l'URL de l'API (`SUPABASE_URL`), la clé anonyme publique (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) et la clé secrète de service (`SUPABASE_SERVICE_ROLE_KEY`). La clé secrète ne doit jamais être transmise au client web ni commitée dans Git.

### 5.3 Actions à mener sur GitHub et GitHub Actions

GitHub héberge le code source de l'équipe et exécute automatiquement les calculs batch périodiques sans nécessiter de serveur dédié payant.

1. **Configuration des secrets du dépôt** :
   - Accédez aux **Settings** du dépôt GitHub, puis dans la section **Secrets and variables > Actions**.
   - Ajoutez les variables secrètes suivantes :
     - `SUPABASE_URL` : L'adresse URL de votre projet Supabase.
     - `SUPABASE_SERVICE_ROLE_KEY` : La clé secrète de rôle de service Supabase pour autoriser l'écriture des résultats de prévision.
2. **Intégration continue (CI)** : Le workflow `.github/workflows/ci.yml` s'exécute automatiquement à chaque ouverture de demande de fusion (Pull Request). Il contrôle la syntaxe TypeScript (`tsc --noEmit`), exécute les tests unitaires Python avec `pytest` et vérifie l'absence de fuite temporelle dans les calculs de variables explicatives.
3. **Pipeline de calcul planifié et déclenchement manuel** :
   - Le fichier `.github/workflows/pipeline.yml` orchestre l'exécution du script maître `ml/run_pipeline.py`.
   - Il dispose d'un déclencheur manuel (`workflow_dispatch`). Lors d'une démonstration officielle, le chef de projet peut se rendre dans l'onglet **Actions**, sélectionner le pipeline et cliquer sur **Run workflow** avec l'option `--advance-week`. Cette action exécute le simulateur, avance l'état des stocks d'une semaine supplémentaire, recalcule les prévisions, optimise les transferts et enregistre un nouveau `run_id` dans Supabase, offrant une démonstration vivante et dynamique.

### 5.4 Actions à mener sur Vercel (Déploiement Web)

Vercel assure le déploiement continu, l'optimisation des assets et la distribution mondiale de l'interface utilisateur.

1. **Importation du projet** : Connectez votre compte Vercel à votre dépôt GitHub et importez le projet en pointant sur le dossier **`web/`**. Vercel détecte automatiquement la configuration Next.js / TypeScript / Tailwind.
2. **Définition des variables d'environnement** :
   - Dans le tableau de bord Vercel, accédez aux paramètres du projet (**Settings > Environment Variables**).
   - Renseignez les variables requises pour le client :
     - `NEXT_PUBLIC_SUPABASE_URL` avec l'URL publique de la base Supabase.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec la clé publique anonyme Supabase.
3. **Paramètres de build et vérification de la production** :
   - Vercel détecte automatiquement la commande de build Next.js (`next build`) et le dossier de sortie `.next`.
   - Lancez le premier déploiement. Vercel génère une URL de prévisualisation (preview) pour chaque branche et déploie automatiquement sur le domaine de production lors de la fusion sur la branche principale `main`.
   - Testez l'affichage sur mobile pour vous assurer que les temps de chargement respectent les seuils de performance et que le viewport s'ajuste parfaitement sur smartphone.

---

## 6. Structure Complète des Fichiers du Projet

```
/
├── README.md                          # Documentation intégrale et guide de déploiement
├── .env.example                       # Variables d'environnement à copier (Supabase uniquement)
├── ml/                                # Pipeline Python : modèle, optimisation, pipeline
│   ├── train_and_export_model.py      # Entraîne réellement le modèle LightGBM
│   ├── evaluate.py                    # Calcule les métriques depuis les données (aucune valeur en dur)
│   ├── run_pipeline.py                # Pipeline maître : prévisions, transferts, VRP, Supabase
│   ├── requirements.txt               # Dépendances Python
│   ├── models/
│   │   ├── demand_lightgbm_v1.joblib  # Modèle sérialisé (généré par train_and_export_model.py)
│   │   └── demand_v1_metadata.json    # Métriques et traçabilité (générées par le script)
│   ├── scripts/
│   │   └── verify_model.py            # Contrôle de réception : taille, attributs, prédictions
│   ├── reports/
│   │   ├── metrics.json               # Métriques calculées (générées par evaluate.py)
│   │   └── model_evaluation_report.md # Rapport Markdown (généré par evaluate.py)
│   ├── src/
│   │   ├── forecasting/
│   │   │   └── train_predict.py       # DemandForecaster : features, LightGBM, CQR
│   │   └── optim/
│   │       ├── transfers_solver.py    # Solveur PuLP pour les transferts inter-établissements
│   │       └── vrp_solver.py          # Solveur OR-Tools pour les tournées de livraison
│   └── tests/
│       ├── test_simulator.py          # Tests des données générées
│       └── test_optim.py              # Tests des solveurs d'optimisation
├── data/
│   ├── simulator/
│   │   └── build_datasets.py          # Génère toutes les données simulées reproductibles
│   ├── processed/                     # CSV générés (non committés si volumineux)
│   └── geo/
│       └── reseau_pilote_benin.csv    # 54 établissements du réseau pilote avec coordonnées
├── supabase/
│   └── migrations/                    # Scripts SQL rejouables sur base vide
└── web/                               # Frontend Next.js + TypeScript + Tailwind + Supabase
    ├── .env.example                   # Variables Supabase pour le frontend
    ├── package.json                   # Dépendances Node.js
    ├── next.config.js                 # Configuration Next.js
    └── src/
        ├── app/                       # App Router Next.js (pages et layouts)
        ├── components/                # Composants React : carte, tableaux de bord, vues
        ├── lib/
        │   └── supabase.ts            # Client Supabase (lecture seule côté navigateur)
        └── types/
            └── pharma.ts              # Interfaces TypeScript pour établissements, stocks et flux
```

---

## 7. Perspectives et Validation en Conditions Réelles

L'étape suivante de la feuille de route consistera à soumettre cette chaîne algorithmique aux autorités sanitaires et aux gestionnaires logistiques de la centrale d'achat pour confronter les prévisions du modèle à des données réelles de dispensation hospitalière. L'intégration progressive de capteurs IoT pour le monitoring thermique continu de la chaîne du froid dans les véhicules de livraison constituera un axe majeur d'extension opérationnelle.
---

## ⚠️ Risques et limites connus

### Budget zéro — points de vigilance

**Supabase (500 Mo gratuit)**
Chaque run du pipeline ajoute ~10 000 lignes dans les tables de résultats. Une politique de rétention
automatique est implémentée dans ml/run_pipeline.py (purge_old_runs, conserve les 5 derniers
runs). Sans cette purge, la base serait pleine au bout de quelques semaines de tests.

**GitHub Actions (2 000 min/mois)**
Un run pipeline prend environ 5 à 10 minutes. Éviter les lancements intempestifs pendant le
développement : tester localement avec --env local --dry-run avant de déclencher Actions.

**Assistant LLM (P2)**
Trouver une API LLM avec Function Calling fiable et 100 % gratuite (sans CB) est difficile.
Groq, Gemini Free et Mistral ont des rate limits stricts. Cette fonctionnalité est P2 et peut
rester désactivée pour la démo principale. La clé LLM_API_KEY est optionnelle.

### Optimisation — limites documentées

**Transferts inter-sites (PLNE)**
La capacité de réception cap[j] distingue maintenant cold_chain_capacity (paramètre optionnel
sur les nœuds déficitaires) et la capacité standard. Si non renseigné, la contrainte se replie
sur le besoin total. Pour une version plus précise, R1 doit renseigner la capacité réfrigérée
de chaque établissement dans eseau_pilote_benin.csv.

**Tournées VRP**
Les deux résolutions séparées (véhicules froids / véhicules secs) peuvent envoyer deux camions
au même établissement le même jour. C'est une heuristique acceptable pour la démo, documentée
comme limite dans docs/MODELE.md. En réalité, les camions réfrigérés peuvent transporter du
sec en complément — cette optimisation est laissée pour une version future.

### Modèle — honnêteté sur les métriques

Les métriques réelles calculées sur le jeu de test (WAPE = 94,4 %, MASE = 1,09) montrent que le
modèle ne bat pas systématiquement le naïf saisonnier sur données simulées. Cela ne remet pas en
cause la chaîne technique (qui fonctionne), mais confirme que la validation sur données réelles
est l'étape suivante obligatoire.

