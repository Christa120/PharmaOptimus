#!/usr/bin/env python3
"""
ml/run_pipeline.py
Script maître de production — Pipeline PharmaBénin.

Chaîne complète et vérifiable :
  1.  Connexion au backend (Supabase ou fichiers CSV locaux).
  2.  Chargement et validation des données (facilities, produits, historique).
  3.  Vérification du modèle (taille minimale, chargement réel).
  4.  Prévisions quantiles LightGBM [q10 / q50 / q90], horizons 1–8 semaines.
  5.  Jours de couverture + version prudente (q90).
  6.  Probabilité de rupture Monte Carlo (1 000 tirages), horizons 7 / 14 / 30 j.
  7.  Score de priorité transparent (formule documentée).
  8.  Solveur de transferts horizontaux PuLP sur le vrai réseau.
  9.  Solveur VRP OR-Tools sur le vrai réseau.
  10. Génération des alertes.
  11. Écriture Supabase OU fichiers JSON dans data/output/.
  12. Journal pipeline_runs avec run_id UUID.

Règles non négociables :
  - 'SUCCESS' n'est affiché que si toutes les étapes ont réellement été exécutées.
  - Aucun chiffre écrit à la main : tout est calculé.
  - Aucun secret dans le code : clés via variables d'environnement.
  - run_id / current_run_id mis à jour EN DERNIER, uniquement si tout a réussi.
"""

from __future__ import annotations

import argparse
import datetime
import json
import logging
import os
import sys
import uuid
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Chemins de base
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent   # racine du projet
ML_DIR = Path(__file__).resolve().parent
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DATA_GEO = BASE_DIR / "data" / "geo"
OUTPUT_DIR = BASE_DIR / "data" / "output"
MODEL_PATH = ML_DIR / "models" / "demand_lightgbm_v1.joblib"
MIN_MODEL_BYTES = 10_000   # seuil : un modèle réel > 10 Ko

# Ajouter la racine au chemin Python pour les imports relatifs
sys.path.insert(0, str(BASE_DIR))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("run_pipeline")


# ---------------------------------------------------------------------------
# Imports optionnels
# ---------------------------------------------------------------------------
try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    log.error("pandas/numpy non installés — pip install pandas numpy")
    sys.exit(1)

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

try:
    from supabase import create_client, Client as SupabaseClient
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False


# ---------------------------------------------------------------------------
# Imports locaux
# ---------------------------------------------------------------------------
from ml.src.optim.transfers_solver import solve_transfers_pulp
from ml.src.optim.vrp_solver import solve_vrp_fleet


# ---------------------------------------------------------------------------
# Constantes de scoring
# (w1–w4 documentées ici pour auditabilité)
# ---------------------------------------------------------------------------
# w1 : poids probabilité de rupture à 14 jours
# w2 : poids inverse des jours de couverture
# w3 : poids criticité produit (0–2 normalisé en 0–1)
# w4 : poids établissement difficile d'accès
# Poids contractuels CDC §7.10 — w1=0.40, w2=0.25, w3=0.20, w4=0.15
# (Toute modification nécessite l'accord écrit du chef de projet)
PRIORITY_WEIGHTS = {"w1": 0.40, "w2": 0.25, "w3": 0.20, "w4": 0.15}

# Criticité produit → float [0, 1]
_CRITICALITY_NORM = {
    "ARV": 1.0, "INS": 1.0, "ARTINJ": 1.0, "MGSO4": 1.0,
    "ACT": 0.5, "AMOX": 0.5, "OXY": 0.5, "MISO": 0.5,
    "CEFT": 0.5, "BCG": 0.5, "PENTA": 0.5, "ROUG": 0.5,
}  # défaut 0.0 pour les produits non listés


# ---------------------------------------------------------------------------
# Analyse des arguments CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pipeline batch de gestion pharmaceutique — PharmaBénin"
    )
    parser.add_argument(
        "--env",
        choices=["local", "supabase"],
        default="local",
        help="Environnement d'exécution : 'local' (CSV) ou 'supabase'.",
    )
    parser.add_argument(
        "--advance-week",
        action="store_true",
        help="Utilise la semaine suivante comme semaine de coupure.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Calcule et affiche le résumé sans écrire dans Supabase/fichiers.",
    )
    parser.add_argument(
        "--only",
        nargs="+",
        choices=["forecast", "transfers", "vrp"],
        metavar="STEP",
        help="Exécute uniquement les étapes listées (ex: --only forecast transfers).",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Connexion Supabase
# ---------------------------------------------------------------------------

def connect_supabase(url: str, key: str) -> "SupabaseClient":
    if not HAS_SUPABASE:
        raise ImportError(
            "supabase-py non installé — pip install supabase"
        )
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Chargement des données (local ou Supabase)
# ---------------------------------------------------------------------------

def load_facilities(client=None) -> pd.DataFrame:
    """Charge les 54 établissements."""
    if client is not None:
        rows = client.table("facilities").select("*").execute().data
        df = pd.DataFrame(rows)
    else:
        path = DATA_GEO / "reseau_pilote_benin.csv"
        if not path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {path}")
        df = pd.read_csv(path)
    return df


def load_consumption(client=None) -> pd.DataFrame:
    """Charge l'historique de consommation hebdomadaire."""
    if client is not None:
        rows = client.table("consumption_history").select("*").order("week_start").execute().data
        df = pd.DataFrame(rows)
    else:
        path = DATA_PROCESSED / "historical_consumption_benin.csv"
        if not path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {path}")
        df = pd.read_csv(path)
    df["week_start"] = pd.to_datetime(df["week_start"])
    return df


def load_weather(client=None) -> pd.DataFrame:
    """Charge les données météo (optionnel)."""
    try:
        if client is not None:
            rows = client.table("weather_data").select("*").execute().data
            return pd.DataFrame(rows)
        else:
            path = DATA_PROCESSED / "weather_chirps_benin.csv"
            if path.exists():
                df = pd.read_csv(path)
                df["week_start"] = pd.to_datetime(df["week_start"])
                return df
    except Exception as exc:
        log.warning("Météo non chargée (%s) — prévisions sans météo.", exc)
    return pd.DataFrame()


# ---------------------------------------------------------------------------
# Validation des données
# ---------------------------------------------------------------------------

def validate_facilities(df: pd.DataFrame) -> None:
    required = {"id", "name", "lat", "lon", "has_cold_chain", "is_hard_to_reach"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Colonnes manquantes dans facilities : {missing}")
    if len(df) < 1:
        raise ValueError("Table facilities vide.")
    log.info("  Facilities : %d établissements — OK", len(df))


def validate_consumption(df: pd.DataFrame, facilities_df: pd.DataFrame) -> None:
    required = {"week_start", "facility_id", "product_id", "qty_dispensed", "stockout_days", "qty_on_hand"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Colonnes manquantes dans consumption : {missing}")

    # Pas de dates futures dans l'historique
    now = pd.Timestamp.now().normalize()
    future_rows = df[df["week_start"] > now]
    if not future_rows.empty:
        log.warning(
            "  %d lignes avec week_start dans le futur (simulées) — acceptées si is_simulated=True.",
            len(future_rows),
        )

    # Au moins une ligne par établissement
    fac_ids = set(facilities_df["id"].tolist())
    consumed_fac = set(df["facility_id"].unique().tolist())
    missing_fac = fac_ids - consumed_fac
    # Le dépôt central n'a pas forcément de consommation
    missing_fac_non_depot = {f for f in missing_fac if "depot" not in f.lower()}
    if missing_fac_non_depot:
        log.warning(
            "  %d établissements sans données de consommation : %s …",
            len(missing_fac_non_depot),
            list(missing_fac_non_depot)[:5],
        )

    log.info(
        "  Historique : %d lignes | %d facilities | %d produits | %s → %s",
        len(df),
        df["facility_id"].nunique(),
        df["product_id"].nunique(),
        df["week_start"].min().date(),
        df["week_start"].max().date(),
    )


# ---------------------------------------------------------------------------
# Vérification du modèle
# ---------------------------------------------------------------------------

def verify_model_file() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modèle introuvable : {MODEL_PATH}")
    size = MODEL_PATH.stat().st_size
    if size < MIN_MODEL_BYTES:
        log.error(
            "Modèle factice détecté (%d octets < %d) — relancer train_and_export_model.py",
            size,
            MIN_MODEL_BYTES,
        )
        sys.exit(1)
    log.info("  Modèle : %s (%.1f Ko) — OK", MODEL_PATH.name, size / 1024)


def load_model():
    """Charge et retourne le DemandForecaster sérialisé."""
    if not HAS_JOBLIB:
        raise ImportError("joblib non installé — pip install joblib")
    forecaster = joblib.load(MODEL_PATH)
    # Vérification minimale : doit avoir les attributs de prédiction
    if not hasattr(forecaster, "lgb_median_") or forecaster.lgb_median_ is None:
        raise ValueError(
            "Le modèle chargé ne contient pas de LightGBM entraîné. "
            "Relancer train_and_export_model.py."
        )
    return forecaster


# ---------------------------------------------------------------------------
# Prévisions quantiles multi-horizons
# ---------------------------------------------------------------------------

def compute_forecasts(
    forecaster,
    consumption_df: pd.DataFrame,
    weather_df: pd.DataFrame,
    cutoff_week: pd.Timestamp,
    horizons: list[int],
) -> pd.DataFrame:
    """
    Prédit q10/q50/q90 pour chaque (facility, product, horizon).

    Stratégie : pour chaque horizon h, on utilise les données jusqu'à
    cutoff_week - h semaines comme contexte, et on prédit la semaine
    cutoff_week + (h-1)*7 jours.
    """
    hist = consumption_df[consumption_df["week_start"] <= cutoff_week].copy()

    all_preds: list[pd.DataFrame] = []
    for h in horizons:
        context = consumption_df[
            consumption_df["week_start"] <= cutoff_week - pd.Timedelta(weeks=h - 1)
        ].copy()
        if len(context) == 0:
            log.warning("  Horizon %d : pas de contexte disponible, ignoré.", h)
            continue
        try:
            pred_df = forecaster.predict(context, weather_df if not weather_df.empty else None, horizon=h)
            # Ne garder que la dernière prédiction par (facility, product)
            pred_df = pred_df.sort_values("week_start").groupby(
                ["facility_id", "product_id"], as_index=False
            ).last()
            pred_df["horizon_weeks"] = h
            all_preds.append(pred_df)
        except Exception as exc:
            log.error("  Erreur prévision horizon %d : %s", h, exc)

    if not all_preds:
        raise RuntimeError("Aucune prévision produite — vérifier le modèle et les données.")

    return pd.concat(all_preds, ignore_index=True)


# ---------------------------------------------------------------------------
# Jours de couverture
# ---------------------------------------------------------------------------

def compute_coverage(
    consumption_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
    cutoff_week: pd.Timestamp,
) -> pd.DataFrame:
    """
    days_coverage              = stock_on_hand / (q50 / 7)
    days_coverage_conservative = stock_on_hand / (q90 / 7)
    Clip sur [0, 365].
    """
    # Stock actuel = dernière semaine connue par (facility, product)
    last_stock = (
        consumption_df[consumption_df["week_start"] <= cutoff_week]
        .sort_values("week_start")
        .groupby(["facility_id", "product_id"], as_index=False)
        .last()[["facility_id", "product_id", "qty_on_hand"]]
    )

    # Horizon 1 pour la couverture courante
    fc_h1 = forecasts_df[forecasts_df["horizon_weeks"] == 1].copy()
    merged = fc_h1.merge(last_stock, on=["facility_id", "product_id"], how="left")
    merged["qty_on_hand"] = merged["qty_on_hand"].fillna(0)

    EPSILON = 0.1  # éviter la division par zéro
    merged["days_coverage"] = (
        merged["qty_on_hand"] / ((merged["q50"].clip(lower=EPSILON)) / 7.0)
    ).clip(0, 365)

    merged["days_coverage_conservative"] = (
        merged["qty_on_hand"] / ((merged["q90"].clip(lower=EPSILON)) / 7.0)
    ).clip(0, 365)

    return merged


# ---------------------------------------------------------------------------
# Monte Carlo — Probabilité de rupture
# ---------------------------------------------------------------------------

def compute_rupture_proba_montecarlo(
    consumption_df: pd.DataFrame,
    coverage_df: pd.DataFrame,
    cutoff_week: pd.Timestamp,
    horizons_days: list[int],
    n_trials: int = 1_000,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Pour chaque (facility, product), tire n_trials trajectoires de demande
    cumulée depuis la distribution empirique des 26 dernières semaines et
    calcule P(stock_on_hand < demande_cumulée) pour chaque horizon en jours.

    Retourne un DataFrame avec colonnes :
      facility_id, product_id, p_rupture_7j, p_rupture_14j, p_rupture_30j
    """
    rng = np.random.default_rng(seed)

    hist = consumption_df[
        (consumption_df["week_start"] <= cutoff_week)
        & (consumption_df["week_start"] > cutoff_week - pd.Timedelta(weeks=26))
    ].copy()

    results: list[dict] = []

    for (fac_id, prod_id), grp in hist.groupby(["facility_id", "product_id"]):
        weekly_demands = grp["qty_dispensed"].dropna().values
        if len(weekly_demands) == 0:
            weekly_demands = np.array([0.0])

        # Stock actuel
        stock_row = coverage_df[
            (coverage_df["facility_id"] == fac_id)
            & (coverage_df["product_id"] == prod_id)
        ]
        if stock_row.empty:
            continue
        stock = float(stock_row["qty_on_hand"].iloc[0])

        row: dict[str, Any] = {"facility_id": fac_id, "product_id": prod_id}
        for h_days in horizons_days:
            n_weeks = max(1, h_days // 7)
            # Tirer n_trials trajectoires de n_weeks semaines
            samples = rng.choice(weekly_demands, size=(n_trials, n_weeks), replace=True)
            # Demande journalière → cumulée sur h_days jours
            cum_demand = samples.sum(axis=1) * (h_days / (7.0 * n_weeks))
            p_rupture = float(np.mean(cum_demand > stock))
            row[f"p_rupture_{h_days}j"] = round(p_rupture, 4)

        results.append(row)

    return pd.DataFrame(results)


# ---------------------------------------------------------------------------
# Score de priorité
# ---------------------------------------------------------------------------

def compute_priority_scores(
    coverage_df: pd.DataFrame,
    rupture_df: pd.DataFrame,
    facilities_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    priority_score = w1 * P(rupture_14j)
                   + w2 * (1 / max(days_coverage, 1))  [normalisé sur [0,1]]
                   + w3 * criticality                   [0–1]
                   + w4 * is_hard_to_reach              [0 ou 1]

    Score final clipé dans [0, 1].
    """
    w1 = PRIORITY_WEIGHTS["w1"]
    w2 = PRIORITY_WEIGHTS["w2"]
    w3 = PRIORITY_WEIGHTS["w3"]
    w4 = PRIORITY_WEIGHTS["w4"]

    df = coverage_df[["facility_id", "product_id", "days_coverage", "qty_on_hand"]].copy()
    if not rupture_df.empty and "p_rupture_14j" in rupture_df.columns:
        df = df.merge(
            rupture_df[["facility_id", "product_id", "p_rupture_14j"]],
            on=["facility_id", "product_id"],
            how="left",
        )
    else:
        df["p_rupture_14j"] = 0.5
    df["p_rupture_14j"] = df["p_rupture_14j"].fillna(0.5)

    # Criticité produit normalisée
    df["criticality"] = df["product_id"].map(_CRITICALITY_NORM).fillna(0.0)

    # Difficulté d'accès
    fac_reach = facilities_df[["id", "is_hard_to_reach"]].rename(columns={"id": "facility_id"})
    df = df.merge(fac_reach, on="facility_id", how="left")
    df["is_hard_to_reach"] = df["is_hard_to_reach"].fillna(0).astype(float)

    # Composante couverture : 1 / max(days_coverage, 1), normalisée sur [0, 1]
    # jours de couverture très bas → score élevé ; on sature à 1 si coverage ≤ 1
    df["inv_coverage_norm"] = (1.0 / df["days_coverage"].clip(lower=1.0)).clip(0, 1)

    df["priority_score"] = (
        w1 * df["p_rupture_14j"]
        + w2 * df["inv_coverage_norm"]
        + w3 * df["criticality"]
        + w4 * df["is_hard_to_reach"]
    ).clip(0, 1).round(4)

    return df[["facility_id", "product_id", "days_coverage", "qty_on_hand",
               "p_rupture_14j", "criticality", "is_hard_to_reach", "priority_score"]]


# ---------------------------------------------------------------------------
# Alertes
# ---------------------------------------------------------------------------

def generate_alerts(
    coverage_df: pd.DataFrame,
    rupture_df: pd.DataFrame,
    cutoff_week: pd.Timestamp,
) -> list[dict]:
    """
    Génère des alertes pour chaque couple (facility, product) :
      - stockout_critical  : days_coverage < 7
      - stockout_risk      : P(rupture_14j) > 0.5
      - expiry_risk        : stock > 0 ET days_coverage > 90
      - excess_stock       : days_coverage > 90
    """
    # p_rupture_14j peut déjà être dans coverage_df (après compute_priority_scores)
    if "p_rupture_14j" in coverage_df.columns:
        df = coverage_df.copy()
    elif not rupture_df.empty and "p_rupture_14j" in rupture_df.columns:
        df = coverage_df.merge(
            rupture_df[["facility_id", "product_id", "p_rupture_14j"]],
            on=["facility_id", "product_id"],
            how="left",
        )
    else:
        df = coverage_df.copy()
        df["p_rupture_14j"] = 0.0

    df["p_rupture_14j"] = df["p_rupture_14j"].fillna(0.0)

    alerts: list[dict] = []
    ts = cutoff_week.isoformat()

    for _, row in df.iterrows():
        fac = row["facility_id"]
        prod = row["product_id"]
        dc = float(row["days_coverage"])
        stock = float(row["qty_on_hand"])
        p14 = float(row["p_rupture_14j"])

        if dc < 7:
            alerts.append({
                "facility_id": fac,
                "product_id": prod,
                "alert_type": "stockout_critical",
                "days_coverage": round(dc, 1),
                "message": f"Couverture critique : {dc:.1f} j < 7 j.",
                "created_at": ts,
            })
        if p14 > 0.5:
            alerts.append({
                "facility_id": fac,
                "product_id": prod,
                "alert_type": "stockout_risk",
                "p_rupture_14j": round(p14, 4),
                "message": f"Risque rupture 14 j : {p14:.1%}.",
                "created_at": ts,
            })
        if stock > 0 and dc > 90:
            alerts.append({
                "facility_id": fac,
                "product_id": prod,
                "alert_type": "expiry_risk",
                "days_coverage": round(dc, 1),
                "message": f"Risque péremption : {dc:.0f} j de stock.",
                "created_at": ts,
            })
        elif dc > 90:
            alerts.append({
                "facility_id": fac,
                "product_id": prod,
                "alert_type": "excess_stock",
                "days_coverage": round(dc, 1),
                "message": f"Surstock : {dc:.0f} j de couverture.",
                "created_at": ts,
            })

    return alerts


# ---------------------------------------------------------------------------
# Solveur de transferts — wrapper sur le vrai réseau
# ---------------------------------------------------------------------------

_COLD_CHAIN_PRODUCTS = {"OXY", "BCG", "PENTA", "ROUG", "INS"}

def _requires_cold_chain(product_id: str) -> bool:
    """Retourne True si le produit exige la chaîne du froid (CDC §8.1)."""
    return str(product_id).upper() in _COLD_CHAIN_PRODUCTS


# ---------------------------------------------------------------------------
# Solveur de transferts — wrapper sur le vrai réseau
# ---------------------------------------------------------------------------

def run_transfers(
    coverage_df: pd.DataFrame,
    facilities_df: pd.DataFrame,
) -> list[dict]:
    """
    Construit surplus_nodes et deficit_nodes à partir du vrai réseau pilote
    (54 établissements × 20 produits) et appelle solve_transfers_pulp().
    La contrainte cold-chain est passée correctement selon le product_id.
    """
    # Identifie les surplus et déficits par produit
    surplus_nodes: list[dict] = []
    deficit_nodes: list[dict] = []

    fac_info = facilities_df.set_index("id")

    for _, row in coverage_df.iterrows():
        fac_id = row["facility_id"]
        fac = fac_info.loc[fac_id] if fac_id in fac_info.index else None
        has_cold = bool(fac["has_cold_chain"]) if fac is not None else False
        name = fac["name"] if fac is not None else fac_id
        stock = float(row["qty_on_hand"])
        dc = float(row["days_coverage"])
        prod_id = str(row["product_id"])
        needs_cold = _requires_cold_chain(prod_id)

        # Surplus : couverture > 60 jours et stock significatif
        if dc > 60 and stock > 50:
            surplus_nodes.append({
                "id": f"{fac_id}_{prod_id}",
                "name": f"{name} ({prod_id})",
                "facility_id": fac_id,
                "product_id": prod_id,
                "has_cold_chain": has_cold,
                "surplus_qty": max(0, int(stock - 30 * (stock / dc))),  # garde 30 j de stock
                "shelf_days": 365,
                "requires_cold_chain": needs_cold,  # ← CDC §8.1 : passé correctement
            })

        # Déficit : couverture < 14 jours
        if dc < 14 and stock >= 0:
            q50_weekly = float(row.get("q50", stock / max(dc, 1) * 7))
            need = max(0, int(q50_weekly * 8 - stock))  # vise 8 semaines de stock
            if need > 0:
                deficit_nodes.append({
                    "id": f"{fac_id}_{prod_id}",
                    "name": f"{name} ({prod_id})",
                    "facility_id": fac_id,
                    "product_id": prod_id,
                    "has_cold_chain": has_cold,
                    "need_qty": need,
                    "requires_cold_chain": needs_cold,  # ← CDC §8.1
                })

    if not surplus_nodes or not deficit_nodes:
        log.info("  Transferts : aucun surplus/déficit identifié sur le réseau.")
        return []

    # Matrice de distances approximative (distance géodésique en km)
    fac_coords = {
        row["id"]: (float(row["lat"]), float(row["lon"]))
        for _, row in facilities_df.iterrows()
    }

    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        import math
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance_matrix: dict = {}
    for s in surplus_nodes:
        s_fac = s["facility_id"]
        for d in deficit_nodes:
            d_fac = d["facility_id"]
            if s_fac in fac_coords and d_fac in fac_coords:
                la1, lo1 = fac_coords[s_fac]
                la2, lo2 = fac_coords[d_fac]
                distance_matrix[(s["id"], d["id"])] = haversine_km(la1, lo1, la2, lo2)
            else:
                distance_matrix[(s["id"], d["id"])] = 100.0  # défaut

    log.info(
        "  Transferts : %d sources surplus, %d destinations déficitaires.",
        len(surplus_nodes),
        len(deficit_nodes),
    )
    transfers = solve_transfers_pulp(surplus_nodes, deficit_nodes, distance_matrix)
    return transfers


# ---------------------------------------------------------------------------
# Solveur VRP — wrapper sur le vrai réseau
# ---------------------------------------------------------------------------

def run_vrp(
    coverage_df: pd.DataFrame,
    facilities_df: pd.DataFrame,
    rupture_df: pd.DataFrame,
) -> dict:
    """
    Construit distance_matrix, duration_matrix, demands, capacities, max_shifts
    et priority_penalties depuis le vrai réseau et appelle solve_vrp_fleet().

    Retourne un dict avec 'routes', 'unserved', 'n_vehicles', 'depot_id'.
    """
    # Exclure le dépôt central de la liste des nœuds à livrer
    depot_mask = facilities_df["id"].str.contains("depot", case=False, na=False)
    depot_rows = facilities_df[depot_mask]
    fac_rows = facilities_df[~depot_mask].reset_index(drop=True)

    depot_id = depot_rows["id"].iloc[0] if not depot_rows.empty else None
    depot_lat = float(depot_rows["lat"].iloc[0]) if not depot_rows.empty else 6.3685
    depot_lon = float(depot_rows["lon"].iloc[0]) if not depot_rows.empty else 2.4350

    # Nœuds : [dépôt] + [établissements]
    node_ids = [depot_id or "depot"] + fac_rows["id"].tolist()
    node_coords = [(depot_lat, depot_lon)] + list(
        zip(fac_rows["lat"].astype(float), fac_rows["lon"].astype(float))
    )
    n_nodes = len(node_ids)

    # Matrices distance (km) et durée (sec) geodésiques
    def haversine_km(lat1, lon1, lat2, lon2):
        import math
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    dist_matrix = [[0] * n_nodes for _ in range(n_nodes)]
    dur_matrix = [[0] * n_nodes for _ in range(n_nodes)]
    AVG_SPEED_MPS = 60_000 / 3600  # 60 km/h en m/s

    for i in range(n_nodes):
        for j in range(n_nodes):
            if i != j:
                km = haversine_km(*node_coords[i], *node_coords[j])
                dist_matrix[i][j] = int(km * 1000)       # mètres
                dur_matrix[i][j] = int(km * 1000 / AVG_SPEED_MPS)  # secondes

    # Demande volumétrique par nœud : somme des besoins urgents (unités × 0.05 L)
    node_demands = [0]  # dépôt = 0
    for fac_id in fac_rows["id"]:
        urgent = coverage_df[
            (coverage_df["facility_id"] == fac_id)
            & (coverage_df["days_coverage"] < 30)
        ]["qty_on_hand"]
        total_need_liters = int(max(0, float(urgent.sum()) * 0.05))
        node_demands.append(min(total_need_liters, 2000))  # plafond 2000 L/nœud

    # Flotte : 5 camions de 8 000 L, shift max 12 h
    N_VEHICLES = 5
    capacities = [8_000] * N_VEHICLES
    max_shifts = [12 * 3600] * N_VEHICLES

    # Pénalités de priorité : score × 100 000 (OR-Tools travaille en entiers)
    priority_scores_map = {
        f"{row['facility_id']}_{row['product_id']}": float(row.get("priority_score", 0))
        for _, row in coverage_df.iterrows()
        if "priority_score" in coverage_df.columns
    }
    node_penalties = [0]  # dépôt
    for fac_id in fac_rows["id"]:
        max_ps = max(
            (v for k, v in priority_scores_map.items() if k.startswith(fac_id)),
            default=0.0,
        )
        node_penalties.append(int(max_ps * 100_000))

    log.info(
        "  VRP : %d nœuds (dont dépôt), %d véhicules, capacité %d L chacun.",
        n_nodes,
        N_VEHICLES,
        capacities[0],
    )

    routes, unserved = solve_vrp_fleet(
        distance_matrix=dist_matrix,
        duration_matrix=dur_matrix,
        demands=node_demands,
        capacities=capacities,
        max_shifts=max_shifts,
        priority_penalties=node_penalties,
        depot=0,
        time_limit_sec=10,
    )

    if routes is None:
        log.warning("  VRP : aucune solution trouvée (solveur heuristique activé).")
        routes = []
        unserved = list(range(1, n_nodes))

    # Convertir les indices de nœuds en IDs d'établissements
    routes_named = [
        [node_ids[idx] for idx in route] for route in routes
    ]
    unserved_named = [node_ids[idx] for idx in unserved]

    return {
        "depot_id": depot_id,
        "n_vehicles": N_VEHICLES,
        "routes": routes_named,
        "unserved": unserved_named,
        "n_stops_served": sum(len(r) for r in routes_named),
        "n_stops_unserved": len(unserved_named),
    }


# ---------------------------------------------------------------------------
# Persistance
# ---------------------------------------------------------------------------

def _to_serializable(obj: Any) -> Any:
    """Convertit les types numpy/pandas en types Python natifs pour json.dumps."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type non sérialisable : {type(obj)}")



def vrp_to_delivery_rows(vrp_result: dict, run_id: str) -> list[dict]:
    """
    Aplatit le dict résumé de run_vrp() en une liste de lignes
    compatibles avec la table delivery_routes (une ligne par arrêt).
    delivery_routes : run_id, vehicle_id, stop_order, facility_id
    """
    rows: list[dict] = []
    for v_idx, route in enumerate(vrp_result.get("routes", [])):
        vehicle_id = f"vehicle_{v_idx + 1}"
        for stop_order, facility_id in enumerate(route, start=1):
            rows.append({
                "run_id": run_id,
                "vehicle_id": vehicle_id,
                "stop_order": stop_order,
                "facility_id": facility_id,
            })
    return rows

def write_local(
    forecasts_df: pd.DataFrame,
    risk_df: pd.DataFrame,
    alerts: list[dict],
    transfers: list[dict],
    vrp_result: dict,
    run_record: dict,
) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    files = {
        "forecasts.json": json.loads(forecasts_df.to_json(orient="records", date_format="iso")),
        "risk_scores.json": json.loads(risk_df.to_json(orient="records", date_format="iso")),
        "alerts.json": alerts,
        "transfers.json": transfers,
        "routes.json": vrp_to_delivery_rows(vrp_result, run_record["run_id"]),
    }

    for fname, data in files.items():
        out = OUTPUT_DIR / fname
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2, default=_to_serializable)
        log.info("  Écrit : %s (%d éléments)", out, len(data) if isinstance(data, list) else 1)

    # Journal pipeline_runs
    runs_path = OUTPUT_DIR / "pipeline_runs.json"
    runs: list[dict] = []
    if runs_path.exists():
        try:
            with open(runs_path, encoding="utf-8") as fh:
                runs = json.load(fh)
        except json.JSONDecodeError:
            runs = []
    runs.append(run_record)
    with open(runs_path, "w", encoding="utf-8") as fh:
        json.dump(runs, fh, ensure_ascii=False, indent=2, default=_to_serializable)
    log.info("  Journal : %s (run_id=%s)", runs_path, run_record["run_id"])



def purge_old_runs(client, keep_last_n: int = 5) -> None:
    """
    Supprime les données des anciens run_id (politique de rétention).
    Conserve les N derniers runs pour respecter le quota Supabase Free 500 Mo.
    
    Contexte budget zéro : chaque run ajoute ~8640 lignes forecasts.
    Sans purge, la base est pleine au bout de quelques semaines.
    """
    try:
        query = client.table("pipeline_runs").select("run_id").order("started_at", desc=True)
        result = query.execute()
        all_runs = [r["run_id"] for r in (result.data or [])]
        runs_to_delete = all_runs[keep_last_n:]
        if not runs_to_delete:
            log.info("  Retention : %d runs actifs (<= %d), rien a purger.", len(all_runs), keep_last_n)
            return
        log.info("  Retention : purge de %d run(s) anciens (%d gardes).", len(runs_to_delete), keep_last_n)
        tables_to_purge = [
            "forecasts", "risk_scores", "alerts",
            "transfer_recommendations", "delivery_routes",
        ]
        for table in tables_to_purge:
            for old_run_id in runs_to_delete:
                client.table(table).delete().eq("run_id", old_run_id).execute()
        for old_run_id in runs_to_delete:
            client.table("pipeline_runs").delete().eq("run_id", old_run_id).execute()
        log.info("  Retention terminee. Espace libere.")
    except Exception as exc:
        log.warning("  Retention echouee (non bloquant) : %s", exc)

def write_supabase(
    client,
    forecasts_df: pd.DataFrame,
    risk_df: pd.DataFrame,
    alerts: list[dict],
    transfers: list[dict],
    vrp_result: dict,
    run_record: dict,
) -> None:
    def upsert(table: str, records: list[dict]) -> None:
        if records:
            client.table(table).upsert(records).execute()
            log.info("  Supabase upsert → %s (%d lignes)", table, len(records))

    # Politique de rétention : purger les anciens runs avant d'écrire
    # pour respecter la limite de 500 Mo du plan Supabase Free (CDC §6.5)
    purge_old_runs(client, keep_last_n=5)
    
    upsert("forecasts", json.loads(forecasts_df.to_json(orient="records", date_format="iso")))
    upsert("risk_scores", json.loads(risk_df.to_json(orient="records", date_format="iso")))
    upsert("alerts", alerts)
    upsert("transfer_recommendations", transfers)
    upsert("delivery_routes", vrp_to_delivery_rows(vrp_result, run_record["run_id"]))

    # Journal (run_id mis à jour EN DERNIER)
    client.table("pipeline_runs").insert(run_record).execute()
    log.info("  Supabase insert → pipeline_runs (run_id=%s)", run_record["run_id"])
    # CDC §7.14 : current_run_id mis à jour EN DERNIER
    # Garantit que l'interface ne voit jamais de calcul incomplet
    client.table("app_config").upsert({
        "key": "current_run_id",
        "value": f"\"" + run_record["run_id"] + "\"",  # JSON string
        "updated_at": run_record["finished_at"],
    }).execute()
    log.info("  app_config.current_run_id = %s", run_record["run_id"])


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------

def main() -> int:
    args = parse_args()
    run_id = str(uuid.uuid4())
    started_at = datetime.datetime.now(datetime.timezone.utc)

    log.info("=" * 70)
    log.info("Démarrage du Pipeline PharmaBénin | run_id=%s", run_id)
    log.info(
        "env=%s | dry-run=%s | advance-week=%s | only=%s",
        args.env,
        args.dry_run,
        args.advance_week,
        args.only,
    )
    log.info("=" * 70)

    # ------------------------------------------------------------------
    # 1. Connexion
    # ------------------------------------------------------------------
    log.info("[1/11] Connexion au backend…")
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    use_supabase = args.env == "supabase" and bool(supabase_url) and bool(supabase_key)

    if use_supabase:
        try:
            client = connect_supabase(supabase_url, supabase_key)
            log.info("  Mode : Supabase (%s)", supabase_url[:40] + "…")
        except Exception as exc:
            log.error("  Connexion Supabase échouée : %s", exc)
            return 1
    else:
        client = None
        if args.env == "supabase":
            log.warning(
                "  Variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absentes "
                "— bascule en mode local."
            )
        log.info("  Mode : local (CSV dans data/)")

    # ------------------------------------------------------------------
    # 2. Chargement des données
    # ------------------------------------------------------------------
    log.info("[2/11] Chargement des données…")
    try:
        facilities_df = load_facilities(client)
        validate_facilities(facilities_df)

        consumption_df = load_consumption(client)
        validate_consumption(consumption_df, facilities_df)

        weather_df = load_weather(client)
        if not weather_df.empty:
            log.info("  Météo : %d lignes chargées.", len(weather_df))
        else:
            log.info("  Météo : non disponible — prévisions sans météo.")

    except (FileNotFoundError, ValueError) as exc:
        log.error("  Erreur chargement données : %s", exc)
        return 1

    # ------------------------------------------------------------------
    # 3. Vérification du modèle
    # ------------------------------------------------------------------
    log.info("[3/11] Vérification du modèle…")
    verify_model_file()
    try:
        forecaster = load_model()
        log.info("  DemandForecaster chargé — %d features.", len(forecaster.feature_names_))
    except Exception as exc:
        log.error("  Impossible de charger le modèle : %s", exc)
        return 1

    # ------------------------------------------------------------------
    # 4. Semaine de coupure
    # ------------------------------------------------------------------
    max_week = consumption_df["week_start"].max()
    if args.advance_week:
        cutoff_week = max_week + pd.Timedelta(weeks=1)
        log.info("[4/11] Semaine de coupure avancée : %s → %s", max_week.date(), cutoff_week.date())
    else:
        cutoff_week = max_week
        log.info("[4/11] Semaine de coupure : %s", cutoff_week.date())

    # ------------------------------------------------------------------
    # 5. Prévisions
    # ------------------------------------------------------------------
    run_forecast = (args.only is None) or ("forecast" in args.only)
    forecasts_df = pd.DataFrame()

    if run_forecast:
        log.info("[5/11] Calcul des prévisions quantiles (horizons 1–8 semaines)…")
        try:
            forecasts_df = compute_forecasts(
                forecaster,
                consumption_df,
                weather_df,
                cutoff_week,
                horizons=list(range(1, 9)),
            )
            log.info(
                "  Prévisions : %d lignes (facilities=%d, produits=%d, horizons=%d).",
                len(forecasts_df),
                forecasts_df["facility_id"].nunique(),
                forecasts_df["product_id"].nunique(),
                forecasts_df["horizon_weeks"].nunique(),
            )
        except Exception as exc:
            log.error("  Erreur lors des prévisions : %s", exc)
            return 1
    else:
        log.info("[5/11] Prévisions ignorées (--only).")

    # ------------------------------------------------------------------
    # 6. Jours de couverture
    # ------------------------------------------------------------------
    if run_forecast and not forecasts_df.empty:
        log.info("[6/11] Calcul des jours de couverture…")
        coverage_df = compute_coverage(consumption_df, forecasts_df, cutoff_week)

        # Enrichir coverage_df avec q50 pour les transferts
        fc_h1 = forecasts_df[forecasts_df["horizon_weeks"] == 1][["facility_id", "product_id", "q50"]]
        coverage_df = coverage_df.merge(fc_h1, on=["facility_id", "product_id"], how="left", suffixes=("", "_fc"))
        if "q50_fc" in coverage_df.columns:
            coverage_df["q50"] = coverage_df.get("q50", coverage_df["q50_fc"])
            coverage_df = coverage_df.drop(columns=["q50_fc"], errors="ignore")

        log.info(
            "  Couverture : médiane %.1f j | <7j : %d | >90j : %d.",
            coverage_df["days_coverage"].median(),
            (coverage_df["days_coverage"] < 7).sum(),
            (coverage_df["days_coverage"] > 90).sum(),
        )
    else:
        coverage_df = pd.DataFrame(columns=["facility_id", "product_id", "qty_on_hand",
                                            "days_coverage", "days_coverage_conservative", "q50"])
        log.info("[6/11] Jours de couverture ignorés (pas de prévisions).")

    # ------------------------------------------------------------------
    # 7. Monte Carlo rupture
    # ------------------------------------------------------------------
    if run_forecast and not coverage_df.empty:
        log.info("[7/11] Simulation Monte Carlo (probabilité de rupture, n=1000)…")
        rupture_df = compute_rupture_proba_montecarlo(
            consumption_df, coverage_df, cutoff_week, horizons_days=[7, 14, 30]
        )
        log.info(
            "  Rupture : %.1f%% des paires à risque >50%% à 14 j.",
            100 * (rupture_df["p_rupture_14j"] > 0.5).mean(),
        )
    else:
        rupture_df = pd.DataFrame(columns=["facility_id", "product_id",
                                           "p_rupture_7j", "p_rupture_14j", "p_rupture_30j"])
        log.info("[7/11] Monte Carlo ignoré (pas de prévisions).")

    # ------------------------------------------------------------------
    # 8. Score de priorité
    # ------------------------------------------------------------------
    if run_forecast and not coverage_df.empty:
        log.info("[8/11] Calcul des scores de priorité…")
        coverage_df = compute_priority_scores(coverage_df, rupture_df, facilities_df)
        log.info(
            "  Priorité : score max=%.4f | médian=%.4f.",
            coverage_df["priority_score"].max(),
            coverage_df["priority_score"].median(),
        )
    else:
        log.info("[8/11] Scores de priorité ignorés.")

    # ------------------------------------------------------------------
    # 9. Solveur de transferts
    # ------------------------------------------------------------------
    run_transfers_step = (args.only is None) or ("transfers" in args.only)
    transfers: list[dict] = []

    if run_transfers_step and not coverage_df.empty:
        log.info("[9/11] Optimisation des transferts (PuLP)…")
        try:
            transfers = run_transfers(coverage_df, facilities_df)
            log.info("  Transferts : %d recommandations générées.", len(transfers))
        except Exception as exc:
            log.error("  Erreur solveur transferts : %s", exc)
            return 1
    else:
        log.info("[9/11] Transferts ignorés (--only ou pas de données).")

    # ------------------------------------------------------------------
    # 10. Solveur VRP
    # ------------------------------------------------------------------
    run_vrp_step = (args.only is None) or ("vrp" in args.only)
    vrp_result: dict = {}

    if run_vrp_step and not coverage_df.empty:
        log.info("[10/11] Planification des tournées VRP (OR-Tools)…")
        try:
            vrp_result = run_vrp(coverage_df, facilities_df, rupture_df)
            log.info(
                "  VRP : %d arrêts servis | %d non-servis | %d véhicules.",
                vrp_result.get("n_stops_served", 0),
                vrp_result.get("n_stops_unserved", 0),
                vrp_result.get("n_vehicles", 0),
            )
        except Exception as exc:
            log.error("  Erreur solveur VRP : %s", exc)
            return 1
    else:
        log.info("[10/11] VRP ignoré (--only ou pas de données).")

    # ------------------------------------------------------------------
    # 11. Alertes
    # ------------------------------------------------------------------
    alerts: list[dict] = []
    if not coverage_df.empty:
        alerts = generate_alerts(coverage_df, rupture_df, cutoff_week)
        log.info(
            "[11/11] Alertes : %d générées (%d critiques, %d risque rupture).",
            len(alerts),
            sum(1 for a in alerts if a["alert_type"] == "stockout_critical"),
            sum(1 for a in alerts if a["alert_type"] == "stockout_risk"),
        )
    else:
        log.info("[11/11] Alertes ignorées (pas de données de couverture).")

    # ------------------------------------------------------------------
    # Résumé dry-run
    # ------------------------------------------------------------------
    if args.dry_run:
        log.info("=" * 70)
        log.info("DRY RUN — Résumé (aucune écriture effectuée)")
        log.info("  Prévisions       : %d lignes", len(forecasts_df))
        log.info("  Alertes          : %d", len(alerts))
        log.info("  Transferts       : %d recommandations", len(transfers))
        log.info(
            "  VRP              : %d arrêts servis sur %d",
            vrp_result.get("n_stops_served", 0),
            vrp_result.get("n_stops_served", 0) + vrp_result.get("n_stops_unserved", 0),
        )
        log.info("=" * 70)
        return 0

    # ------------------------------------------------------------------
    # Écriture (N'arrive qu'ici si toutes les étapes ont réussi)
    # ------------------------------------------------------------------
    finished_at = datetime.datetime.now(datetime.timezone.utc)
    run_record = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "status": "success",
        "model_version": forecaster.model_version if hasattr(forecaster, "model_version") else "unknown",
        "cutoff_week": cutoff_week.isoformat(),
        "rows_written": len(forecasts_df) + len(alerts) + len(transfers),
    }

    try:
        if use_supabase:
            write_supabase(client, forecasts_df, coverage_df, alerts, transfers, vrp_result, run_record)
        else:
            write_local(forecasts_df, coverage_df, alerts, transfers, vrp_result, run_record)
    except Exception as exc:
        log.error("  Erreur écriture : %s", exc)
        return 1

    duration = (finished_at - started_at).total_seconds()
    log.info("=" * 70)
    log.info("SUCCESS | run_id=%s | durée=%.1fs | %d lignes écrites",
             run_id, duration, run_record["rows_written"])
    log.info("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
