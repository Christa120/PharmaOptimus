# Rapport de Contrôle Qualité des Données
Généré automatiquement par `data/simulator/build_datasets.py` — seed=42
Date de génération : 2026-10-01 22:33:28

---

## 1. Dimensions du jeu de données

| Indicateur | Valeur |
|---|---|
| Lignes totales (historical_consumption) | 129,500 |
| Structures consommant | 53 / 53 (hors dépôt central) |
| Produits simulés | 20 / 20 |
| Semaines couvertes | 140 (2024-01-01 → 2026-09-28) |
| Hash de reproductibilité (seed=42) | `2ac8e69f14b9e51b3e1aa3bc9f094c05` |

Répartition des 54 structures :
  - `central_depot` : 1
  - `health_center` : 28
  - `pharmacy` : 12
  - `referral_hospital` : 13

---

## 2. Invariants de stock

| Contrôle | Résultat |
|---|---|
| Quantités dispensées négatives | **0** |
| Stocks négatifs (qty_on_hand) | **0** |
| Violations équation stock (stock_t+1 ≠ stock_t + recv - disp) | **0** / 124,152 paires vérifiables |
| Taux de violation | **0.0000%** (seuil : 0.1%) |
| Statut | **✓ PASSÉ** |

---

## 3. Imperfections injectées

| Type | Valeur | Taux |
|---|---|---|
| Anomalies (valeurs aberrantes ×5-10) | 603 | 0.47% (cible ~0.5%) |
| Valeurs manquantes | 3852 | 2.97% (cible ~3%) |
| Colonne `is_anomaly_injected` | Présente | Toutes les lignes |

---

## 4. Taux de semaines à zéro ou manquantes par produit

  - `ACT` : 3.0% de semaines à zéro ou manquantes
  - `AMLO` : 4.5% de semaines à zéro ou manquantes
  - `AMOX` : 3.3% de semaines à zéro ou manquantes
  - `ARTINJ` : 3.7% de semaines à zéro ou manquantes
  - `ARV` : 6.2% de semaines à zéro ou manquantes
  - `BCG` : 4.1% de semaines à zéro ou manquantes
  - `CEFT` : 5.0% de semaines à zéro ou manquantes
  - `INS` : 5.1% de semaines à zéro ou manquantes
  - `METF` : 4.8% de semaines à zéro ou manquantes
  - `MGSO4` : 6.6% de semaines à zéro ou manquantes
  - `MISO` : 4.5% de semaines à zéro ou manquantes
  - `OXY` : 4.6% de semaines à zéro ou manquantes
  - `PARA` : 3.4% de semaines à zéro ou manquantes
  - `PENTA` : 3.5% de semaines à zéro ou manquantes
  - `RINGER` : 3.2% de semaines à zéro ou manquantes
  - `ROUG` : 4.7% de semaines à zéro ou manquantes
  - `SP` : 3.2% de semaines à zéro ou manquantes
  - `SRO` : 3.9% de semaines à zéro ou manquantes
  - `TDR` : 3.1% de semaines à zéro ou manquantes
  - `ZINC` : 4.2% de semaines à zéro ou manquantes

---

## 5. Chocs simulés (seed=42 + 1)

- **3 épidémies paludisme** : pics × 2.5-4.0 sur ACT, SP, ARTINJ, TDR (3-7 semaines)
- **2 ruptures approvisionnement central** : livraisons réduites à 20-35% pendant 4-8 semaines
- **1 campagne de vaccination** : demande × 1.8 sur BCG, PENTA, ROUG pendant 3-5 semaines

---

## 6. Contrainte chaîne du froid

Produits cold-chain (OXY, BCG, PENTA, ROUG, INS) uniquement alloués aux structures
`has_cold_chain=1`. Aucune ligne générée vers des structures sans chaîne du froid.
