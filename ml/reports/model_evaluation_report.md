# Rapport d'évaluation du modèle de prévisions

> **⚠ DONNÉES SIMULÉES** — Ce modèle a été entraîné et évalué sur des données
> entièrement simulées. Les métriques ci-dessous reflètent la performance sur
> des données synthétiques ; elles ne constituent pas une validation sur des
> données réelles de dispensation pharmaceutique.

## Informations de traçabilité

| Champ | Valeur |
|-------|--------|
| Généré le | 2026-10-01T22:35:19.928452+00:00 |
| Version modèle | demand_lightgbm_v1.0.0 |
| Split évalué | test |
| SHA-256 données | `09706088c053ebea…` |
| Git hash | `a68219c6d9cf` |

## Métriques globales

| Métrique | Valeur | Interprétation |
|----------|--------|----------------|
| WAPE modèle | 0.9443 | Erreur relative pondérée (↓ mieux) |
| WAPE naïf saisonnier | 0.8646 | Référence simple |
| MASE | 1.0922 | < 1 = meilleur que naïf |
| RMSSE | 1.0176 | Ratio RMSE / RMSE naïf |
| Biais relatif | -0.1269 | Proche de 0 = non biaisé |
| Perte pinball q10 | 8.2478 | Qualité borne basse |
| Perte pinball q90 | 33.7811 | Qualité borne haute |
| Couverture [q10, q90] | 0.5933 | Cible : ≥ 0,80 |
| WAPE oracle | 0.6287 | Plancher théorique |
| Efficacité | 1.5019 | WAPE / WAPE_oracle (↓ mieux) |
| IC 95 % WAPE (bootstrap) | [0.9149, 0.9721] | Incertitude estimation |

## Performance par type d'établissement

| Type | WAPE | WAPE naïf | MASE | Couverture |
|------|------|-----------|------|------------|
| health_center | 1.0253 | 0.9132 | 1.1227 | 0.6292 |
| hospital | 0.8867 | 0.8300 | 1.0683 | 0.5110 |

## Performance par département

| Département | WAPE | WAPE naïf | MASE | Couverture |
|-------------|------|-----------|------|------------|
| Alibori | 0.8732 | 1.0430 | 0.8372 | 0.6120 |
| Atacora | 0.7768 | 0.8384 | 0.9265 | 0.6466 |
| Atlantique | 1.1032 | 0.9976 | 1.1059 | 0.7000 |
| Borgou | 0.8306 | 0.8844 | 0.9392 | 0.4973 |
| Collines | 2.5571 | 0.8018 | 3.1892 | 0.5227 |
| Couffo | 1.0942 | 0.8823 | 1.2401 | 0.5781 |
| Donga | 1.1324 | 0.8457 | 1.3391 | 0.6471 |
| Littoral | 0.9365 | 0.8304 | 1.1277 | 0.6065 |
| Mono | 1.0521 | 0.9273 | 1.1346 | 0.5755 |
| Ouémé | 0.8256 | 0.7965 | 1.0366 | 0.3012 |
| Plateau | 0.8193 | 0.9126 | 0.8978 | 0.6639 |
| Zou | 0.8358 | 0.8438 | 0.9905 | 0.6216 |

## Performance par famille thérapeutique

| Famille | WAPE | WAPE naïf | MASE | Couverture |
|---------|------|-----------|------|------------|
| antibiotiques | 1.0384 | 0.8532 | 1.2172 | 0.5833 |
| antipaludiques | 0.7643 | 0.8317 | 0.9189 | 0.5680 |
| autres | 1.0294 | 0.9065 | 1.1356 | 0.6112 |
| maternels | 1.4131 | 0.9060 | 1.5596 | 0.5833 |
| vaccins | 0.8143 | 0.8026 | 1.0146 | 0.6040 |

## Interprétation honnête

### Points positifs

- Précision (WAPE = 0.9443) : à améliorer (≥ 0,50).
- Comparaison naïf (MASE = 1.0922) : inférieur au naïf.
- Intervalles de prévision (couverture = 0.5933) : sous-couverture (< 0,80).

### Limites et mises en garde

- **Données simulées** : toutes ces métriques ont été calculées sur des données
  synthétiques. La performance sur données réelles peut différer significativement.
- **Horizon** : les prédictions sont à horizon 1 semaine. Les erreurs augmentent
  pour des horizons plus longs.
- **Efficacité modèle** : 1.5019 (ratio WAPE / WAPE oracle). Une valeur
  proche de 1,0 indique que le modèle approche la limite théorique du signal.
- **Validation requise** : une validation sur des données réelles de dispensation
  est indispensable avant toute utilisation en production.

---
*Rapport généré automatiquement par `ml/evaluate.py` le 2026-10-01T22:35:19.928452+00:00.*
*Toutes les valeurs proviennent des calculs sur données — aucune n'est écrite en dur.*
