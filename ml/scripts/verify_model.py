"""
ml/scripts/verify_model.py
Contrôle de réception du modèle demand_lightgbm_v1.joblib.

Vérifie :
  1. Taille du fichier > 10 000 octets.
  2. Attributs lgb_median_, lgb_q10_, lgb_q90_ présents et de type LGBMModel.
  3. Prédiction cohérente sur mini-jeu synthétique (3 séries × 60 semaines) :
     q10 <= q50 <= q90 pour chaque ligne.
  4. Métadonnées : status == 'validated_on_simulated_data'.

Usage :
    python ml/scripts/verify_model.py
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
import pandas as pd

# Assurer que la racine du projet est dans sys.path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

MODEL_PATH = os.path.join(ROOT, "ml", "models", "demand_lightgbm_v1.joblib")
METADATA_PATH = os.path.join(ROOT, "ml", "models", "demand_v1_metadata.json")
CONSUMPTION_CSV = os.path.join(ROOT, "data", "processed", "historical_consumption_benin.csv")

_FAIL_PREFIX = "CONTRÔLE ÉCHOUÉ — "
_PASS_MSG = "CONTRÔLE RÉUSSI — modèle réel chargé."


def fail(reason: str) -> None:
    print(f"{_FAIL_PREFIX}{reason}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    print("=" * 60)
    print("PharmaOptimus — Contrôle de réception du modèle")
    print("=" * 60)

    # ------------------------------------------------------------------
    # 1. Taille du fichier
    # ------------------------------------------------------------------
    print("\n[1/4] Vérification taille du fichier…")
    if not os.path.isfile(MODEL_PATH):
        fail(f"fichier modèle introuvable → {MODEL_PATH}")

    model_size = os.path.getsize(MODEL_PATH)
    print(f"  Taille : {model_size:,} octets")
    if model_size <= 10_000:
        fail(
            f"le fichier modèle ({model_size} octets) est trop petit. "
            "Un LightGBM entraîné doit dépasser 10 000 octets. "
            "Ce fichier contient probablement un objet vide ou factice."
        )
    print("  ✓ Taille OK")

    # ------------------------------------------------------------------
    # 2. Chargement et attributs
    # ------------------------------------------------------------------
    print("\n[2/4] Chargement et vérification des attributs…")
    try:
        import joblib
    except ImportError:
        fail("joblib n'est pas installé. pip install joblib")

    try:
        forecaster = joblib.load(MODEL_PATH)
    except Exception as exc:
        fail(f"impossible de charger le modèle : {exc}")

    print(f"  Type objet chargé : {type(forecaster).__name__}")

    # Vérifier attributs
    for attr in ["lgb_median_", "lgb_q10_", "lgb_q90_"]:
        if not hasattr(forecaster, attr):
            fail(f"attribut manquant : {attr}")
        val = getattr(forecaster, attr)
        if val is None:
            fail(f"attribut {attr} est None — le modèle n'a pas été entraîné.")

    # Vérifier le type LGBMModel
    try:
        import lightgbm as lgb
        for attr in ["lgb_median_", "lgb_q10_", "lgb_q90_"]:
            val = getattr(forecaster, attr)
            if not isinstance(val, (lgb.LGBMModel, lgb.basic.Booster)):
                fail(
                    f"attribut {attr} est de type {type(val).__name__}, "
                    "attendu lightgbm.LGBMModel ou lightgbm.basic.Booster."
                )

        # Infos sur lgb_median_
        model_med = forecaster.lgb_median_
        try:
            n_trees = model_med.n_estimators_
            print(f"  lgb_median_ : n_estimators_={n_trees}")
        except AttributeError:
            print("  lgb_median_ : (n_estimators_ non disponible via sklearn API)")

        feat_names = getattr(forecaster, "feature_names_", [])
        if feat_names:
            print(f"  Nombre de features : {len(feat_names)}")
            print(f"  10 premières features : {feat_names[:10]}")
        else:
            print("  feature_names_ : vide ou absent")

    except ImportError:
        fail("lightgbm n'est pas installé. pip install lightgbm")

    print("  ✓ Attributs OK")

    # ------------------------------------------------------------------
    # 3. Prédiction sur mini-DataFrame synthétique
    # ------------------------------------------------------------------
    print("\n[3/4] Prédiction sur mini-jeu synthétique (3 séries × 60 semaines)…")

    # On construit un mini-DataFrame avec 3 séries facility×product, 60 semaines chacune.
    # Cela permet à build_features() d'avoir des lags jusqu'à lag_52w disponibles
    # sur les dernières lignes de chaque série.
    #
    # On utilise des facility_id réels (présents dans le réseau pilote) pour que
    # _merge_facility_info() trouve les métadonnées correctement.
    REAL_FACILITIES = [
        ("fac-cnhu-cotonou", "ACT"),
        ("fac-chu-mel", "AMOX"),
        ("fac-cs-calave", "PARA"),
    ]

    # Charger les données réelles ou construire synthétiquement
    rng_state = np.random.default_rng(0)
    weeks_60 = pd.date_range("2024-01-01", periods=60, freq="W-MON")

    rows = []
    for fac_id, prod_id in REAL_FACILITIES:
        qty_vals = np.abs(rng_state.normal(150, 40, size=60)).clip(0)
        sd_vals = rng_state.integers(0, 3, size=60).astype(float)
        for i, w in enumerate(weeks_60):
            rows.append({
                "week_start": w,
                "facility_id": fac_id,
                "product_id": prod_id,
                "qty_dispensed": round(float(qty_vals[i]), 1),
                "stockout_days": float(sd_vals[i]),
            })

    mini_df = pd.DataFrame(rows)
    print(f"  Mini-DataFrame : {len(mini_df)} lignes, {mini_df['facility_id'].nunique()} séries")

    try:
        predictions = forecaster.predict(mini_df)
    except Exception as exc:
        fail(f"erreur lors de l'appel à forecaster.predict() : {exc}")

    print(f"  Prédictions obtenues : {len(predictions)} lignes")

    if len(predictions) == 0:
        fail(
            "aucune prédiction produite. "
            "Vérifiez que le modèle reçoit assez d'historique pour les lags (lag_52w = 52 semaines)."
        )

    # Vérifier l'ordre q10 <= q50 <= q90 pour toutes les lignes
    print(f"\n  {'facility_id':<20} {'product':<8} {'semaine':<12} {'q10':>8} {'q50':>8} {'q90':>8}  OK?")
    print(f"  {'-'*20} {'-'*8} {'-'*12} {'-'*8} {'-'*8} {'-'*8}  ---")

    all_ok = True
    shown = 0
    for _, row in predictions.iterrows():
        ok = row["q10"] <= row["q50"] <= row["q90"]
        if not ok:
            all_ok = False
        if shown < 9 or not ok:  # afficher les 9 premières + toutes les violations
            flag = "✓" if ok else "✗ VIOLATION"
            print(
                f"  {str(row['facility_id']):<20} {str(row['product_id']):<8} "
                f"{str(row['week_start'])[:10]:<12} "
                f"{row['q10']:>8.2f} {row['q50']:>8.2f} {row['q90']:>8.2f}  {flag}"
            )
            shown += 1

    if shown < len(predictions):
        ok_count = (predictions["q10"] <= predictions["q50"]).sum()
        print(f"  … ({len(predictions)} lignes au total, {ok_count} avec q10 ≤ q50)")

    if not all_ok:
        fail("violation de l'ordre q10 ≤ q50 ≤ q90 pour au moins une ligne.")

    print("  ✓ Prédictions cohérentes (q10 ≤ q50 ≤ q90)")

    # ------------------------------------------------------------------
    # 4. Métadonnées
    # ------------------------------------------------------------------
    print("\n[4/4] Vérification des métadonnées…")
    if not os.path.isfile(METADATA_PATH):
        fail(f"fichier métadonnées introuvable → {METADATA_PATH}")

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    status = metadata.get("status", "")
    expected_status = "validated_on_simulated_data"
    if status != expected_status:
        fail(
            f"status dans les métadonnées = '{status}', "
            f"attendu '{expected_status}'. "
            "Mettez à jour demand_v1_metadata.json avec le bon statut."
        )

    print(f"  status          : {status}")
    print(f"  trained_at      : {metadata.get('trained_at', '?')}")
    print(f"  model_size      : {metadata.get('model_size_bytes', '?'):,} octets")
    print(f"  cv_wape_mean    : {metadata.get('cv_wape_mean', '?')}")
    print(f"  test_coverage   : {metadata.get('test_coverage_q10_q90', '?')}")
    print("  ✓ Métadonnées OK")

    # ------------------------------------------------------------------
    # Résultat final
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print(_PASS_MSG)
    print("=" * 60)
    sys.exit(0)


if __name__ == "__main__":
    main()
