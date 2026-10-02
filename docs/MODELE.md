# docs/MODELE.md — Fiche du modèle (Model Card)

> **⚠ IMPORTANT** — Ce document est généré à partir de `ml/reports/metrics.json` et
> `ml/models/demand_v1_metadata.json`, produits par `ml/train_and_export_model.py` et
> `ml/evaluate.py`. Aucune valeur n'est écrite à la main. Pour régénérer :
>
> ```
> python data/simulator/build_datasets.py
> python ml/train_and_export_model.py
> python ml/evaluate.py --split test --out ml/reports/metrics.json
> ```

---

## 1. Objectif

Estimer la demande hebdomadaire future pour les 20 médicaments traceurs au niveau de chaque
formation sanitaire du Bénin, horizons 1 à 8 semaines, pour prévenir les ruptures critiques
et minimiser les péremptions.

---

## 2. Données d'entraînement

| Paramètre | Valeur |
|---|---|
| Période | 2024-01-01 → 2026-06-30 (train + calibration) |
| Jeu de test final (intouché) | 2026-07-01 → 2026-09-28 (12 semaines) |
| Établissements | 53 avec consommation + 1 dépôt central = 54 au total |
| Produits traceurs | 20 (Annexe A du cahier des charges) |
| Lignes d'entraînement | 112 850 |
| SHA-256 données | `09706088c053ebea…` (voir metadata.json pour valeur complète) |
| Graine aléatoire | 42 |

---

## 3. Architecture

| Composant | Détail |
|---|---|
| Algorithme | LightGBM global multi-séries |
| Objectif médiane (q50) | `tweedie`, variance power = 1.5 |
| Objectif borne basse (q10) | `quantile`, alpha = 0.10 |
| Objectif borne haute (q90) | `quantile`, alpha = 0.90 |
| Intervalles | Calibration conforme (CQR) après entraînement |
| Hyperparamètres | n_estimators=200, num_leaves=31, learning_rate=0.05, seed=42 |
| Features | 30 variables (lags 1–52 sem., rolling stats, censure, calendrier, météo, établissement, produit) |

---

## 4. Protocole de validation

- Validation à origine glissante : 4 plis, chaque pli validé sur un horizon glissant.
- Jeu de test final : 12 dernières semaines, utilisé **une seule fois** pour le rapport.
- Graines multiples : non (une seule graine = 42 pour reproductibilité stricte).

---

## 5. Métriques réelles sur le jeu de test final

> Ces métriques sont calculées par `ml/evaluate.py` depuis les données réelles.
> Fichier source : `ml/reports/metrics.json` (généré le 2026-10-01T22:35:19+00:00).

### 5.1 Métriques globales

| Métrique | Valeur calculée | Objectif CDC | Statut |
|---|---|---|---|
| **WAPE modèle** | **94.4 %** | Amélioration ≥ 15 % vs naïf | ❌ Non atteint |
| **WAPE naïf saisonnier** | 86.5 % | — | Référence |
| **MASE** | 1.09 | < 0.85 | ❌ Non atteint (> 1 : modèle moins bon que le naïf) |
| **RMSSE** | 1.02 | — | — |
| **Biais global** | -12.7 % | \|biais\| ≤ 5 % | ❌ Non atteint |
| **Couverture [q10, q90]** | 59.3 % | 76 %–84 % | ❌ Non atteint (cible 80 %) |
| **WAPE oracle** | 62.9 % | — | Plancher théorique |
| **Efficacité** | 1.50 | ≤ 1.30 | ❌ Non atteint |
| **IC 95 % WAPE (bootstrap)** | [91.5 %, 97.2 %] | — | |

> **Note** : `train_and_export_model.py` rapporte WAPE = 60.9 % sur un split légèrement
> différent (prédiction directe via lgb_median_ sur features construites avec contexte train+cal).
> `evaluate.py` rapporte 94.4 % en utilisant build_features sur le contexte seul.
> Les deux sont calculés par code. L'écart s'explique par la différence de contexte fourni
> aux lags : avec plus de contexte, les lags sont mieux remplis. La valeur conservative
> de 94.4 % est celle retenue pour le rapport.

### 5.2 Performance par type d'établissement

| Type | WAPE | MASE | Couverture |
|---|---|---|---|
| Centres de santé | 102.5 % | 1.12 | 62.9 % |
| Hôpitaux | 88.7 % | 1.07 | 51.1 % |

### 5.3 Performance par département

| Département | WAPE | MASE | Couverture |
|---|---|---|---|
| Alibori | 87.3 % | 0.84 ✓ | 61.2 % |
| Atacora | 77.7 % | 0.93 ✓ | 64.7 % |
| Atlantique | 110.3 % | 1.11 | 70.0 % |
| Borgou | 83.1 % | 0.94 ✓ | 49.7 % |
| **Collines** | **255.7 %** | **3.19** | 52.3 % |
| Couffo | 109.4 % | 1.24 | 57.8 % |
| Donga | 113.2 % | 1.34 | 64.7 % |
| Littoral | 93.7 % | 1.13 | 60.7 % |
| Mono | 105.2 % | 1.13 | 57.5 % |
| Ouémé | 82.6 % | 1.04 | 30.1 % |
| Plateau | 81.9 % | 0.90 ✓ | 66.4 % |
| Zou | 83.6 % | 0.99 ✓ | 62.2 % |

### 5.4 Performance par famille thérapeutique

| Famille | WAPE | MASE | Couverture |
|---|---|---|---|
| Antipaludiques | 76.4 % | 0.92 ✓ | 56.8 % |
| Antibiotiques | 103.8 % | 1.22 | 58.3 % |
| Vaccins | 81.4 % | 1.01 | 60.4 % |
| Maternels (OXY, MGSO4, MISO) | 141.3 % | 1.56 | 58.3 % |
| Autres (PARA, ARV, RINGER…) | 102.9 % | 1.14 | 61.1 % |

### 5.5 Validation croisée (4 plis glissants)

| Paramètre | Valeur |
|---|---|
| CV WAPE moyen | 66.1 % |
| CV WAPE écart-type | 2.0 % |
| Couverture conforme (CQR) | 80.0 % ✓ |

---

## 6. Analyse honnête des résultats

### 6.1 Ce qui fonctionne

- **Antipaludiques** : MASE = 0.92, meilleur que le naïf. Le signal CHIRPS retardé de 4 semaines est exploité.
- **Alibori, Atacora, Borgou, Plateau, Zou** : MASE < 1, le modèle bat le naïf sur ces zones.
- **Calibration conforme** : couverture CQR = 80.0 % sur le jeu de calibration. L'intervalle est bien calibré en validation.
- **Reproductibilité** : seed=42, versions figées, résultats régénérables par commande.

### 6.2 Ce qui ne fonctionne pas encore

- **MASE global = 1.09 > 1** : sur le jeu de test, le modèle ne bat pas le naïf saisonnier en médiane. Objectif CDC non atteint.
- **Couverture test = 59.3 %** au lieu de 80 % : la calibration CQR apprise sur le jeu de validation ne se transfère pas bien au test. La distribution du test est décalée.
- **Collines : WAPE = 255 %, MASE = 3.19** : anomalie détectée. Possible choc simulé (épidémie) dans cette zone sur la période de test. À investiguer.
- **Biais = -12.7 %** : sous-estimation systématique. Le modèle prédit trop peu, notamment sur les hôpitaux (biais = -35.3 %).
- **Couverture Ouémé = 30 %** : très faible. Les intervalles sont trop étroits sur les hôpitaux de grande capacité.

### 6.3 Causes probables

1. **Données simulées uniquement** : les séries générées ont une structure régulière. Le modèle apprend des patterns relativement stables, pas les véritables irrégularités des données réelles.
2. **140 semaines = 2,7 ans** : insuffisant pour que LightGBM apprenne correctement les lags de 52 semaines avec des données de validation croisée robustes.
3. **Distribution de test décalée** : les 12 dernières semaines (juillet–septembre 2026) incluent un pic paludisme simulé. Le modèle ne le capture pas bien.
4. **Hyperparamètres légers** : n_estimators=200, num_leaves=31 sont délibérément contraints pour permettre l'entraînement CPU. Un modèle plus profond améliorerait probablement les résultats.

### 6.4 Pistes d'amélioration

- Augmenter l'historique à 3–5 ans (plus de données simulées).
- Régler les hyperparamètres par Optuna sur les plis de validation.
- Ajouter les features de lag à 52 semaines uniquement quand l'historique est suffisant (>104 semaines).
- Recalibrer CQR séparément par type d'établissement.
- Tester la combinaison (ensemble) avec AutoETS de statsforecast.

---

## 7. Conditions d'usage

**Ce modèle est validé uniquement sur données simulées.**

Les performances mesurées prouvent que la chaîne technique fonctionne dans un environnement
contrôlé. Elles ne prouvent pas la performance en conditions réelles.

**La validation sur données réelles de dispensation est l'étape suivante obligatoire**
avant tout usage en production.

| Condition | Valeur |
|---|---|
| Statut | `validated_on_simulated_data` |
| Utilisation en production | **Interdite sans validation sur données réelles** |
| Utilisation en démonstration | Autorisée avec mention explicite des limites |
| Maintenance | Réentraîner dès que des données réelles sont disponibles |

---

## 8. Taille et traçabilité du fichier modèle

| Paramètre | Valeur |
|---|---|
| Fichier | `ml/models/demand_lightgbm_v1.joblib` |
| Taille | 1 846 217 octets (1 803 Ko) |
| SHA-256 données d'entraînement | `09706088c053ebea…` |
| Date d'entraînement | 2026-10-01T22:20:14+00:00 |
| Commande de vérification | `python ml/scripts/verify_model.py` |
| Résultat attendu | `CONTRÔLE RÉUSSI — modèle réel chargé.` |
