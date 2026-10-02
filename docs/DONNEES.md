# docs/DONNEES.md — Sources, couches et qualité des données

> Toutes les valeurs numériques de ce document (nombre de lignes, structures, produits)
> sont calculées par `data/simulator/build_datasets.py`. Pour régénérer :
> `python data/simulator/build_datasets.py`

---

## 1. Les trois couches de données (CDC §2.2)

| Couche | Nature | Exemples |
|---|---|---|
| **Réelle** | Téléchargée en ligne, sourcée | Limites administratives (geoBoundaries), géolocalisation établissements (OSM), météo (Open-Meteo/CHIRPS), liste médicaments essentiels (OMS) |
| **Calibrée** | Paramètres tirés de sources publiques | Ordres de grandeur de consommation, saisonnalité du paludisme, délais d'approvisionnement |
| **Simulée** | Générée par le simulateur | Stocks, consommations, commandes, lots, péremptions |

---

## 2. Réseau pilote des établissements

**Fichier** : `data/geo/reseau_pilote_benin.csv`

| Type | Nombre | Détail |
|---|---|---|
| Dépôt central national | 1 | Cotonou (position simulée) |
| Hôpitaux de référence | 13 | 1 par département + 1 supplémentaire (Atacora) |
| Centres de santé | 28 | Répartis dans les 12 départements |
| Pharmacies | 12 | Urbaines (Cotonou, Parakou, Porto-Novo…) |
| **Total** | **54** | |

Critères de diversité respectés :
- 12 départements couverts ✓
- Mélange urbain / périurbain / rural ✓
- Gradient Nord-Sud (Malanville à 12,07°N, Cotonou à 6,37°N) ✓
- 6 sites difficiles d'accès (Boukoumbé, Karimama, Banikoara, Nikki, Pèrèrè, Copargo, Matéri) ✓
- Chaque établissement porte sa source et son identifiant OSM quand disponible ✓

---

## 3. Produits traceurs (20)

**Source** : Annexe A du cahier des charges, validée contre la liste OMS.

| Code | Produit | Cold chain | Criticité |
|---|---|---|---|
| ACT | Artéméther-Luméfantrine | Non | Vitale |
| SP | Sulfadoxine-Pyriméthamine | Non | Vitale |
| ARTINJ | Artésunate injectable | Non | Vitale |
| TDR | Test diagnostic rapide paludisme | Non | Vitale |
| AMOX | Amoxicilline 500mg | Non | Essentielle |
| PARA | Paracétamol 500mg | Non | Essentielle |
| SRO | Sels de réhydratation orale | Non | Vitale |
| ZINC | Zinc 20mg | Non | Essentielle |
| CEFT | Ceftriaxone 1g inj. | Non | Vitale |
| OXY | Ocytocine 10 UI inj. | **Oui** | Vitale |
| MGSO4 | Sulfate de Magnésium | Non | Vitale |
| MISO | Misoprostol 200µg | Non | Vitale |
| BCG | Vaccin BCG | **Oui** | Vitale |
| PENTA | Vaccin Pentavalent | **Oui** | Vitale |
| ROUG | Vaccin Rougeole | **Oui** | Vitale |
| INS | Insuline humaine NPH | **Oui** | Vitale |
| ARV | Antirétroviral (TDF/3TC/EFV) | Non | Vitale |
| AMLO | Amlodipine 5mg | Non | Essentielle |
| METF | Metformine 500mg | Non | Essentielle |
| RINGER | Ringer Lactate 500ml | Non | Vitale |

---

## 4. Historique de consommation

**Fichier** : `data/processed/historical_consumption_benin.csv`

| Paramètre | Valeur |
|---|---|
| Période | 2024-01-01 → 2026-08-31 (140 semaines) |
| Établissements avec consommation | 53 (le dépôt central n'a pas de consommation propre) |
| Produits | 20 |
| Lignes totales | ~129 500 (53 × 20 × 140 − exclusions cold-chain) |
| Contrainte cold-chain | OXY, BCG, PENTA, ROUG, INS uniquement vers `has_cold_chain=1` |
| `is_simulated` | `true` sur 100 % des lignes |
| `is_anomaly_injected` | Colonne séparée, ~3 % de lignes avec anomalies injectées |

---

## 5. Vérité terrain (oracle)

**Fichier** : `data/processed/ground_truth.csv`

Contient la demande latente non observée (`latent_true_mean`, `unobserved_demand`) pour chaque
(établissement, produit, semaine). Utilisé uniquement par `ml/evaluate.py` pour calculer
la borne d'erreur irréductible (WAPE oracle = 62.9 %).

**Ce fichier n'est jamais fourni au modèle.**

---

## 6. Données météorologiques

**Fichier** : `data/processed/weather_chirps_benin.csv`

| Paramètre | Valeur |
|---|---|
| Source | Open-Meteo (archive réelle), CHIRPS en fallback synthétique |
| Période | 2024-01-01 → 2026-08-31 |
| Départements | 12 |
| Lignes | ~1 680 (12 × 140) |
| Variables | `rain_mm` (précipitations hebdomadaires), `temp_mean_c` |
| Utilisation | Feature `lag_rain_4` (pluie retardée 4 semaines) dans le modèle |

---

## 7. Quartiers du Grand Nokoué

**Fichier** : `data/geo/quartiers_cotonou_calavi.csv`

13 quartiers de Cotonou et Abomey-Calavi avec coordonnées et source OSM.
Utilisés pour le zoom urbain sur la carte.

---

## 8. Paramètres du simulateur

**Fichier** : `data/simulator/params.yaml`

Tous les paramètres sont documentés avec leur source ou leur hypothèse :
- Facteur de détour Haversine : 1.4 (hypothèse)
- Vitesse sur voie bitumée : 55 km/h (hypothèse)
- Vitesse sur piste : 30 km/h (hypothèse)
- Ralentissement saison des pluies : 0.70 (hypothèse)
- Délai approvisionnement central : 6 semaines (hypothèse, ordre de grandeur)
- Stock de sécurité cible : 21 jours (hypothèse)

---

## 9. Contrôles qualité automatiques

Lancés par `run_quality_checks()` dans `data/simulator/build_datasets.py` à chaque exécution :

| Contrôle | Résultat |
|---|---|
| Quantités négatives | 0 violation |
| Équation de stock | 0 violation (tolérance 0) |
| Reproductibilité (seed=42) | Identique à chaque exécution |
| `is_simulated` sur toutes les lignes | 100 % |
| Contrainte cold-chain | Aucune dispensation de produit cold-chain vers structure sans frigo |

Rapport détaillé : `ml/reports/data_quality.md` (généré automatiquement).

---

## 10. Ce qui n'est pas encore dans le dépôt (à compléter)

| Manque | Raison | Impact |
|---|---|---|
| SHA-256 de chaque fichier de données | Non calculé automatiquement dans ce doc | Traçabilité partielle |
| `data/SOURCES.md` complet pour les 33 nouvelles structures | Sources OSM non vérifiées pour les CS ajoutés | CDC §6.2 |
| Données worldPop (population par zone) | Non téléchargées | La `served_population` est estimée |
| Données DHIS2 réelles | Accès non disponible | Structure de tables basée sur la documentation |
