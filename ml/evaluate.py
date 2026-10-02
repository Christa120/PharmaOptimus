"""
ml/evaluate.py
Évaluation du modèle de prévisions de la demande sur un split test ou val.

Toutes les métriques sont calculées à partir des données — aucune n'est écrite en dur.

Usage :
    python ml/evaluate.py --split test --out ml/reports/metrics.json
    python ml/evaluate.py --split val  --out ml/reports/metrics.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd

# Assurer que le répertoire racine est dans le path Python
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

try:
    import joblib
except ImportError:
    print("ERREUR : joblib est requis. pip install joblib", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Chemins par défaut
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(ROOT, "ml", "models", "demand_lightgbm_v1.joblib")
CONSUMPTION_CSV = os.path.join(ROOT, "data", "processed", "historical_consumption_benin.csv")
WEATHER_CSV = os.path.join(ROOT, "data", "processed", "weather_chirps_benin.csv")
GROUND_TRUTH_CSV = os.path.join(ROOT, "data", "processed", "ground_truth.csv")
REPORTS_DIR = os.path.join(ROOT, "ml", "reports")

# ---------------------------------------------------------------------------
# Mapping produit → famille thérapeutique (miroir de train_predict.py)
# ---------------------------------------------------------------------------
_PRODUCT_FAMILY_MAP = {
    "ACT": "antipaludiques",
    "ARTINJ": "antipaludiques",
    "SP": "antipaludiques",
    "TDR": "antipaludiques",
    "AMOX": "antibiotiques",
    "CEFT": "antibiotiques",
    "ARV": "autres",
    "BCG": "vaccins",
    "PENTA": "vaccins",
    "ROUG": "vaccins",
    "INS": "autres",
    "METF": "autres",
    "AMLO": "autres",
    "MGSO4": "maternels",
    "MISO": "maternels",
    "OXY": "maternels",
    "PARA": "autres",
    "RINGER": "autres",
    "SRO": "autres",
    "ZINC": "autres",
}

# Mapping type établissement → catégorie lisible
_TYPE_MAP = {
    "central_depot": "depot",
    "referral_hospital": "hospital",
    "health_center": "health_center",
    "pharmacy": "pharmacy",
}


# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def git_hash() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, text=True, cwd=ROOT, timeout=10
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return "no_git"


# ---------------------------------------------------------------------------
# Métriques
# ---------------------------------------------------------------------------

def wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """WAPE = sum|pred - true| / sum(true) sur lignes true > 0 et finies."""
    mask = (y_true > 0) & np.isfinite(y_true) & np.isfinite(y_pred)
    if mask.sum() == 0:
        return float("nan")
    return float(np.abs(y_pred[mask] - y_true[mask]).sum() / y_true[mask].sum())


def rmsse(y_true: np.ndarray, y_pred: np.ndarray, y_naive: np.ndarray) -> float:
    """RMSSE = RMSE(modèle) / RMSE(naïf). Ignore NaN values."""
    mask = np.isfinite(y_true) & np.isfinite(y_pred) & np.isfinite(y_naive)
    if mask.sum() == 0:
        return float("nan")
    yt, yp, yn = y_true[mask], y_pred[mask], y_naive[mask]
    rmse_model = float(np.sqrt(np.mean((yp - yt) ** 2)))
    rmse_naive = float(np.sqrt(np.mean((yn - yt) ** 2)))
    if rmse_naive == 0:
        return float("nan")
    return rmse_model / rmse_naive


def bias_metric(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Biais relatif = mean(pred - true) / mean(true). Ignore NaN values."""
    mask = np.isfinite(y_true) & np.isfinite(y_pred)
    if mask.sum() == 0:
        return float("nan")
    yt, yp = y_true[mask], y_pred[mask]
    mean_true = float(np.mean(yt))
    if mean_true == 0:
        return float("nan")
    return float(np.mean(yp - yt) / mean_true)


def pinball_loss(y_true: np.ndarray, y_pred: np.ndarray, alpha: float) -> float:
    """Perte pinball pour le quantile alpha. Ignore les NaN."""
    mask = np.isfinite(y_true) & np.isfinite(y_pred)
    if mask.sum() == 0:
        return float("nan")
    yt, yp = y_true[mask], y_pred[mask]
    diff = yt - yp
    return float(np.mean(np.where(diff >= 0, alpha * diff, (alpha - 1) * diff)))


def coverage(y_true: np.ndarray, q_lo: np.ndarray, q_hi: np.ndarray) -> float:
    """Proportion d'observations finies dans [q_lo, q_hi]."""
    mask = np.isfinite(y_true) & np.isfinite(q_lo) & np.isfinite(q_hi)
    if mask.sum() == 0:
        return float("nan")
    return float(np.mean((q_lo[mask] <= y_true[mask]) & (y_true[mask] <= q_hi[mask])))


def bootstrap_wape_ci(
    y_true: np.ndarray, y_pred: np.ndarray, n_boot: int = 500, seed: int = 42
) -> tuple[float, float]:
    """Intervalle de confiance à 95% sur WAPE par bootstrap."""
    rng = np.random.default_rng(seed)
    n = len(y_true)
    boot_wapes: list[float] = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, size=n)
        yt = y_true[idx]
        yp = y_pred[idx]
        w = wape(yt, yp)
        if not np.isnan(w):
            boot_wapes.append(w)
    if len(boot_wapes) < 2:
        return (float("nan"), float("nan"))
    arr = np.array(boot_wapes)
    lo = float(np.percentile(arr, 2.5))
    hi = float(np.percentile(arr, 97.5))
    return (lo, hi)


def compute_metrics(
    y_true: np.ndarray,
    q10: np.ndarray,
    q50: np.ndarray,
    q90: np.ndarray,
    y_naive: np.ndarray,
    oracle_mean: Optional[np.ndarray] = None,
    n_boot: int = 500,
) -> dict:
    """Calcule toutes les métriques globales sur un ensemble de prédictions."""
    w = wape(y_true, q50)
    w_naive = wape(y_true, y_naive)
    mase_val = w / w_naive if (not np.isnan(w_naive) and w_naive > 0) else float("nan")
    rmsse_val = rmsse(y_true, q50, y_naive)
    bias_val = bias_metric(y_true, q50)
    pb10 = pinball_loss(y_true, q10, 0.1)
    pb90 = pinball_loss(y_true, q90, 0.9)
    cov = coverage(y_true, q10, q90)
    ci = bootstrap_wape_ci(y_true, q50, n_boot=n_boot)

    oracle_w: float = float("nan")
    efficiency: float = float("nan")
    if oracle_mean is not None:
        oracle_w = wape(y_true, oracle_mean)
        if not np.isnan(oracle_w) and oracle_w > 0:
            efficiency = w / oracle_w

    return {
        "wape": round(w, 6) if not np.isnan(w) else None,
        "wape_naive": round(w_naive, 6) if not np.isnan(w_naive) else None,
        "mase": round(mase_val, 6) if not np.isnan(mase_val) else None,
        "rmsse": round(rmsse_val, 6) if not np.isnan(rmsse_val) else None,
        "bias": round(bias_val, 6) if not np.isnan(bias_val) else None,
        "pinball_q10": round(pb10, 6),
        "pinball_q90": round(pb90, 6),
        "coverage_q10_q90": round(cov, 6),
        "oracle_wape": round(oracle_w, 6) if not np.isnan(oracle_w) else None,
        "efficiency": round(efficiency, 6) if not np.isnan(efficiency) else None,
        "wape_ci_95": [round(ci[0], 6), round(ci[1], 6)],
    }


def compute_segment_metrics(df_eval: pd.DataFrame) -> dict:
    """Métriques par segment (type établissement, département, famille produit)."""
    segments: dict[str, dict] = {}

    # --- Par type d'établissement ---
    by_type: dict[str, dict] = {}
    for ftype, grp in df_eval.groupby("facility_type"):
        m = compute_metrics(
            grp["y_true"].values, grp["q10"].values,
            grp["q50"].values, grp["q90"].values,
            grp["y_naive"].values,
            grp["oracle_mean"].values if "oracle_mean" in grp.columns else None,
            n_boot=200,
        )
        by_type[str(ftype)] = m
    segments["by_facility_type"] = by_type

    # --- Par département ---
    by_dept: dict[str, dict] = {}
    for dept, grp in df_eval.groupby("department"):
        m = compute_metrics(
            grp["y_true"].values, grp["q10"].values,
            grp["q50"].values, grp["q90"].values,
            grp["y_naive"].values,
            grp["oracle_mean"].values if "oracle_mean" in grp.columns else None,
            n_boot=200,
        )
        by_dept[str(dept)] = m
    segments["by_department"] = by_dept

    # --- Par famille produit ---
    by_family: dict[str, dict] = {}
    for fam, grp in df_eval.groupby("product_family"):
        m = compute_metrics(
            grp["y_true"].values, grp["q10"].values,
            grp["q50"].values, grp["q90"].values,
            grp["y_naive"].values,
            grp["oracle_mean"].values if "oracle_mean" in grp.columns else None,
            n_boot=200,
        )
        by_family[str(fam)] = m
    segments["by_product_family"] = by_family

    return segments


# ---------------------------------------------------------------------------
# Naïf saisonnier
# ---------------------------------------------------------------------------

def compute_naive_seasonal(df: pd.DataFrame) -> np.ndarray:
    """
    Naïf saisonnier : valeur qty_dispensed de la même semaine de l'année précédente.
    Si absente, repli sur rolling mean 13 semaines.

    Retourne un array numpy aligné sur df (même index, même ordre).
    """
    df = df.copy().reset_index(drop=True)
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(["facility_id", "product_id", "week_start"])
    sort_order = df.index.copy()  # index original → position triée

    df["week_num"] = df["week_start"].dt.isocalendar().week.astype(int)
    df["year"] = df["week_start"].dt.year

    # Construire un lookup : pour chaque (fac, prod, year, week_num), qty de l'an précédent
    # On évite les doublons en prenant la première valeur
    lookup = (
        df[["facility_id", "product_id", "year", "week_num", "qty_dispensed"]]
        .drop_duplicates(subset=["facility_id", "product_id", "year", "week_num"], keep="first")
        .copy()
    )
    lookup["target_year"] = lookup["year"] + 1  # la ligne qui recherche cette valeur
    lookup = lookup.rename(columns={"qty_dispensed": "naive_seasonal"})
    lookup = lookup[["facility_id", "product_id", "target_year", "week_num", "naive_seasonal"]]
    lookup = lookup.rename(columns={"target_year": "year"})

    merged = df.merge(
        lookup,
        on=["facility_id", "product_id", "year", "week_num"],
        how="left",
    )

    # Repli : rolling mean 13 semaines passées (shift 1 pour éviter fuite)
    roll_fallback = df.groupby(["facility_id", "product_id"])["qty_dispensed"].transform(
        lambda x: x.shift(1).rolling(13, min_periods=1).mean()
    )
    # Aligner par position (merged peut avoir le même nbre de lignes que df après merge left + dedup)
    # Si la taille a changé (collision de clés), on reindex
    if len(merged) != len(df):
        # En cas de doublons persistants, garder first
        merged = merged.drop_duplicates(
            subset=["facility_id", "product_id", "week_start"], keep="first"
        ).reset_index(drop=True)

    naive_vals = merged["naive_seasonal"].values.copy()
    fallback_vals = roll_fallback.values[:len(merged)]
    nan_mask = np.isnan(naive_vals.astype(float))
    naive_vals = naive_vals.astype(float)
    naive_vals[nan_mask] = fallback_vals[nan_mask]
    naive_vals = np.where(np.isnan(naive_vals), 0.0, naive_vals)
    return naive_vals


# ---------------------------------------------------------------------------
# Chargement et préparation du jeu d'évaluation
# ---------------------------------------------------------------------------

def prepare_eval_df(
    split: str,
    consumption_df: pd.DataFrame,
    gt_df: pd.DataFrame,
    network_df: pd.DataFrame,
    forecaster,
    weather_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Pour le split donné :
    1. Sélectionne les semaines cibles.
    2. Utilise toute l'histoire précédant ces semaines pour construire les features (lags).
    3. Appelle forecaster.predict() pour obtenir q10, q50, q90.
    4. Aligne avec y_true (qty_dispensed) et oracle_mean (latent_true_mean).
    5. Ajoute facility_type, department, product_family, y_naive.
    Retourne un DataFrame prêt pour compute_metrics().
    """
    consumption_df = consumption_df.copy()
    consumption_df["week_start"] = pd.to_datetime(consumption_df["week_start"])

    if split == "test":
        cutoff_start = pd.Timestamp("2026-07-01")
        split_mask = consumption_df["week_start"] >= cutoff_start
    else:  # val
        cutoff_start = pd.Timestamp("2026-05-01")
        cutoff_end = pd.Timestamp("2026-06-30")
        split_mask = (consumption_df["week_start"] >= cutoff_start) & (
            consumption_df["week_start"] <= cutoff_end
        )

    # Contexte : toutes les données avant le début du split (pour les lags)
    context_df = consumption_df[consumption_df["week_start"] < cutoff_start]
    target_df = consumption_df[split_mask].copy()

    print(f"  Split '{split}' : {len(target_df)} lignes cibles, {len(context_df)} lignes de contexte")

    # --- Prédictions via build_features + modèles directs (cohérence avec train_and_export_model.py) ---
    combined = pd.concat([context_df, target_df], ignore_index=True)
    combined["week_start"] = pd.to_datetime(combined["week_start"])

    X_combined, y_combined = forecaster.build_features(combined, weather_df)

    # Reconstruire les indices pour filtrer sur le split cible
    combined_sorted = combined.sort_values(["facility_id", "product_id", "week_start"]).copy()
    sd_comb = combined_sorted["stockout_days"].fillna(0).clip(0, 6)
    combined_sorted["qty_adjusted"] = combined_sorted["qty_dispensed"] * (
        7.0 / (7.0 - sd_comb).clip(lower=1.0)
    )
    for lag in [1, 2, 3, 4, 8, 13, 26, 52]:
        combined_sorted[f"lag_{lag}w"] = combined_sorted.groupby(
            ["facility_id", "product_id"]
        )["qty_adjusted"].shift(lag)
    lag_cols = [f"lag_{l}w" for l in [1, 2, 3, 4, 8, 13, 26, 52]]
    combined_valid = combined_sorted.dropna(subset=lag_cols).reset_index(drop=True)

    n_common = min(len(X_combined), len(combined_valid))
    X_combined = X_combined.iloc[:n_common].reset_index(drop=True)
    y_combined_arr = y_combined.values[:n_common]
    weeks_valid = pd.to_datetime(combined_valid["week_start"].values[:n_common])
    fac_valid = combined_valid["facility_id"].values[:n_common]
    prod_valid = combined_valid["product_id"].values[:n_common]
    sd_valid = combined_valid["stockout_days"].values[:n_common]
    qty_disp_valid = combined_valid["qty_dispensed"].values[:n_common]

    if split == "test":
        split_mask = weeks_valid >= cutoff_start
    else:
        split_mask = (weeks_valid >= cutoff_start) & (weeks_valid <= cutoff_end)

    X_split = X_combined[split_mask].reset_index(drop=True)
    y_true_raw = qty_disp_valid[split_mask]
    sd_split = sd_valid[split_mask]
    weeks_split = weeks_valid[split_mask]
    fac_split = fac_valid[split_mask]
    prod_split = prod_valid[split_mask]

    # Correction censure (idem modèle)
    y_true_adj = y_true_raw * (7.0 / (7.0 - np.clip(sd_split, 0, 6)).clip(1.0))

    import numpy as _np
    q10_pred = _np.maximum(0, forecaster.lgb_q10_.predict(X_split) - forecaster.cqr_offset_lo_)
    q50_pred = _np.maximum(0, forecaster.lgb_median_.predict(X_split))
    q90_pred = _np.maximum(0, forecaster.lgb_q90_.predict(X_split) + forecaster.cqr_offset_hi_)
    q10_pred = _np.minimum(q10_pred, q50_pred)
    q90_pred = _np.maximum(q90_pred, q50_pred)

    predictions = pd.DataFrame({
        "facility_id": fac_split,
        "product_id": prod_split,
        "week_start": weeks_split,
        "q10": _np.round(q10_pred, 2),
        "q50": _np.round(q50_pred, 2),
        "q90": _np.round(q90_pred, 2),
        "model_version": forecaster.model_version,
    })

    print(f"  Prédictions générées (via build_features direct) : {len(predictions)} lignes")

    # Aligner avec y_true
    eval_df = predictions.copy()
    eval_df["y_true"] = y_true_adj
    eval_df["y_true_raw"] = y_true_raw
    eval_df["stockout_days"] = sd_split

    # Oracle : latent_true_mean depuis ground_truth
    gt_df = gt_df.copy()
    gt_df["week_start"] = pd.to_datetime(gt_df["week_start"])
    eval_df = eval_df.merge(
        gt_df[["week_start", "facility_id", "product_id", "latent_true_mean"]],
        on=["week_start", "facility_id", "product_id"],
        how="left",
    ).rename(columns={"latent_true_mean": "oracle_mean"})

    # Métadonnées établissement
    net_cols = network_df[["id", "type", "department"]].rename(columns={"id": "facility_id"})
    eval_df = eval_df.merge(net_cols, on="facility_id", how="left")
    eval_df["facility_type"] = eval_df["type"].map(_TYPE_MAP).fillna("other")
    eval_df["department"] = eval_df["department"].fillna("Inconnu")

    # Famille produit
    eval_df["product_family"] = eval_df["product_id"].map(_PRODUCT_FAMILY_MAP).fillna("autres")

    # Naïf saisonnier : calculé sur l'ensemble complet (contexte + cible)
    naive_all = compute_naive_seasonal(
        pd.concat([context_df, target_df], ignore_index=True)
    )
    naive_df = pd.concat([context_df, target_df], ignore_index=True).copy()
    naive_df["y_naive"] = naive_all
    naive_df["week_start"] = pd.to_datetime(naive_df["week_start"])

    eval_df = eval_df.merge(
        naive_df[["facility_id", "product_id", "week_start", "y_naive"]],
        on=["facility_id", "product_id", "week_start"],
        how="left",
    )
    eval_df["y_naive"] = eval_df["y_naive"].fillna(0.0)

    print(f"  Lignes après alignement : {len(eval_df)}")
    return eval_df


# ---------------------------------------------------------------------------
# Génération du rapport Markdown
# ---------------------------------------------------------------------------

def _fmt(val) -> str:
    """Formate une valeur numérique ou None pour le rapport."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return "N/A"
    return f"{val:.4f}"


def generate_markdown_report(metrics: dict, out_path: str) -> None:
    """Génère model_evaluation_report.md à partir de metrics.json sans rien écrire en dur."""
    g = metrics["global"]
    split = metrics.get("split", "?")
    gen_at = metrics.get("generated_at", "?")
    model_ver = metrics.get("model_version", "?")
    data_hash = metrics.get("data_hash", "?")
    git_h = metrics.get("git_hash", "?")

    ci = g.get("wape_ci_95", [None, None])
    ci_str = f"[{_fmt(ci[0])}, {_fmt(ci[1])}]" if ci else "N/A"

    lines = [
        "# Rapport d'évaluation du modèle de prévisions",
        "",
        "> **⚠ DONNÉES SIMULÉES** — Ce modèle a été entraîné et évalué sur des données",
        "> entièrement simulées. Les métriques ci-dessous reflètent la performance sur",
        "> des données synthétiques ; elles ne constituent pas une validation sur des",
        "> données réelles de dispensation pharmaceutique.",
        "",
        "## Informations de traçabilité",
        "",
        f"| Champ | Valeur |",
        f"|-------|--------|",
        f"| Généré le | {gen_at} |",
        f"| Version modèle | {model_ver} |",
        f"| Split évalué | {split} |",
        f"| SHA-256 données | `{data_hash[:16]}…` |",
        f"| Git hash | `{git_h[:12] if git_h != 'no_git' else 'no_git'}` |",
        "",
        "## Métriques globales",
        "",
        "| Métrique | Valeur | Interprétation |",
        "|----------|--------|----------------|",
        f"| WAPE modèle | {_fmt(g.get('wape'))} | Erreur relative pondérée (↓ mieux) |",
        f"| WAPE naïf saisonnier | {_fmt(g.get('wape_naive'))} | Référence simple |",
        f"| MASE | {_fmt(g.get('mase'))} | < 1 = meilleur que naïf |",
        f"| RMSSE | {_fmt(g.get('rmsse'))} | Ratio RMSE / RMSE naïf |",
        f"| Biais relatif | {_fmt(g.get('bias'))} | Proche de 0 = non biaisé |",
        f"| Perte pinball q10 | {_fmt(g.get('pinball_q10'))} | Qualité borne basse |",
        f"| Perte pinball q90 | {_fmt(g.get('pinball_q90'))} | Qualité borne haute |",
        f"| Couverture [q10, q90] | {_fmt(g.get('coverage_q10_q90'))} | Cible : ≥ 0,80 |",
        f"| WAPE oracle | {_fmt(g.get('oracle_wape'))} | Plancher théorique |",
        f"| Efficacité | {_fmt(g.get('efficiency'))} | WAPE / WAPE_oracle (↓ mieux) |",
        f"| IC 95 % WAPE (bootstrap) | {ci_str} | Incertitude estimation |",
        "",
        "## Performance par type d'établissement",
        "",
        "| Type | WAPE | WAPE naïf | MASE | Couverture |",
        "|------|------|-----------|------|------------|",
    ]

    for ftype, m in sorted(metrics.get("by_facility_type", {}).items()):
        lines.append(
            f"| {ftype} | {_fmt(m.get('wape'))} | {_fmt(m.get('wape_naive'))} "
            f"| {_fmt(m.get('mase'))} | {_fmt(m.get('coverage_q10_q90'))} |"
        )

    lines += [
        "",
        "## Performance par département",
        "",
        "| Département | WAPE | WAPE naïf | MASE | Couverture |",
        "|-------------|------|-----------|------|------------|",
    ]

    for dept, m in sorted(metrics.get("by_department", {}).items()):
        lines.append(
            f"| {dept} | {_fmt(m.get('wape'))} | {_fmt(m.get('wape_naive'))} "
            f"| {_fmt(m.get('mase'))} | {_fmt(m.get('coverage_q10_q90'))} |"
        )

    lines += [
        "",
        "## Performance par famille thérapeutique",
        "",
        "| Famille | WAPE | WAPE naïf | MASE | Couverture |",
        "|---------|------|-----------|------|------------|",
    ]

    for fam, m in sorted(metrics.get("by_product_family", {}).items()):
        lines.append(
            f"| {fam} | {_fmt(m.get('wape'))} | {_fmt(m.get('wape_naive'))} "
            f"| {_fmt(m.get('mase'))} | {_fmt(m.get('coverage_q10_q90'))} |"
        )

    wape_val = g.get("wape")
    mase_val = g.get("mase")
    cov_val = g.get("coverage_q10_q90")
    eff_val = g.get("efficiency")

    interp_wape = (
        "satisfaisante (< 0,50)" if wape_val is not None and wape_val < 0.50
        else "à améliorer (≥ 0,50)" if wape_val is not None
        else "non calculée"
    )
    interp_mase = (
        "meilleur que le naïf" if mase_val is not None and mase_val < 1.0
        else "inférieur au naïf" if mase_val is not None
        else "non calculé"
    )
    interp_cov = (
        "intervalle bien calibré (≥ 0,80)" if cov_val is not None and cov_val >= 0.80
        else "sous-couverture (< 0,80)" if cov_val is not None
        else "non calculée"
    )

    lines += [
        "",
        "## Interprétation honnête",
        "",
        "### Points positifs",
        "",
        f"- Précision (WAPE = {_fmt(wape_val)}) : {interp_wape}.",
        f"- Comparaison naïf (MASE = {_fmt(mase_val)}) : {interp_mase}.",
        f"- Intervalles de prévision (couverture = {_fmt(cov_val)}) : {interp_cov}.",
        "",
        "### Limites et mises en garde",
        "",
        "- **Données simulées** : toutes ces métriques ont été calculées sur des données",
        "  synthétiques. La performance sur données réelles peut différer significativement.",
        "- **Horizon** : les prédictions sont à horizon 1 semaine. Les erreurs augmentent",
        "  pour des horizons plus longs.",
        f"- **Efficacité modèle** : {_fmt(eff_val)} (ratio WAPE / WAPE oracle). Une valeur",
        "  proche de 1,0 indique que le modèle approche la limite théorique du signal.",
        "- **Validation requise** : une validation sur des données réelles de dispensation",
        "  est indispensable avant toute utilisation en production.",
        "",
        "---",
        f"*Rapport généré automatiquement par `ml/evaluate.py` le {gen_at}.*",
        "*Toutes les valeurs proviennent des calculs sur données — aucune n'est écrite en dur.*",
    ]

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  Rapport Markdown → {out_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Évaluation du modèle de prévisions de la demande")
    parser.add_argument(
        "--split", choices=["test", "val"], default="test",
        help="Split à évaluer : 'test' (>= 2026-07-01) ou 'val' (2026-05-01 à 2026-06-30)"
    )
    parser.add_argument(
        "--out", default=os.path.join(REPORTS_DIR, "metrics.json"),
        help="Chemin de sortie pour metrics.json"
    )
    parser.add_argument(
        "--n-boot", type=int, default=500,
        help="Nombre de tirages bootstrap pour les IC (défaut : 500)"
    )
    args = parser.parse_args()

    print("=" * 70)
    print(f"PharmaOptimus — Évaluation modèle (split={args.split})")
    print("=" * 70)

    # 1. Charger les données
    print("\n[1/5] Chargement des données…")
    for path in [CONSUMPTION_CSV, WEATHER_CSV, GROUND_TRUTH_CSV, MODEL_PATH]:
        if not os.path.isfile(path):
            print(f"ERREUR : fichier introuvable → {path}", file=sys.stderr)
            sys.exit(1)

    consumption_df = pd.read_csv(CONSUMPTION_CSV)
    weather_df = pd.read_csv(WEATHER_CSV)
    gt_df = pd.read_csv(GROUND_TRUTH_CSV)

    data_hash = sha256_file(CONSUMPTION_CSV)
    print(f"  SHA-256 consommation : {data_hash[:16]}…")
    print(f"  Lignes consommation  : {len(consumption_df)}")
    print(f"  Lignes météo         : {len(weather_df)}")
    print(f"  Lignes ground_truth  : {len(gt_df)}")

    # Réseau pilote
    net_path = os.path.join(ROOT, "data", "geo", "reseau_pilote_benin.csv")
    if not os.path.isfile(net_path):
        print(f"ERREUR : réseau pilote introuvable → {net_path}", file=sys.stderr)
        sys.exit(1)
    network_df = pd.read_csv(net_path)

    # 2. Charger le modèle
    print("\n[2/5] Chargement du modèle…")
    model_size = os.path.getsize(MODEL_PATH)
    print(f"  Taille du fichier modèle : {model_size:,} octets")
    if model_size < 10_000:
        print(
            f"ERREUR : le modèle ({model_size} o) est trop petit — ce n'est pas un LightGBM entraîné.",
            file=sys.stderr
        )
        sys.exit(1)

    forecaster = joblib.load(MODEL_PATH)
    print(f"  Modèle chargé : {type(forecaster).__name__}")
    print(f"  Features : {len(getattr(forecaster, 'feature_names_', []))}")

    # 3. Préparer le jeu d'évaluation
    print(f"\n[3/5] Préparation du split '{args.split}'…")
    # Note : la méthode de calcul utilisée ici suit la même logique que
    # train_and_export_model.py (build_features sur contexte + split, prédiction via lgb direct).
    eval_df = prepare_eval_df(
        args.split, consumption_df, gt_df, network_df, forecaster, weather_df
    )

    if len(eval_df) == 0:
        print("ERREUR : aucune ligne dans le jeu d'évaluation après alignement.", file=sys.stderr)
        sys.exit(1)

    # Supprimer les lignes sans y_true valide (problème d'alignement, stockout total, etc.)
    pre_drop = len(eval_df)
    eval_df = eval_df.dropna(subset=["y_true"]).reset_index(drop=True)
    if pre_drop > len(eval_df):
        print(f"  ⚠ {pre_drop - len(eval_df)} lignes sans y_true écartées (sur {pre_drop})")

    if len(eval_df) == 0:
        print("ERREUR : aucune ligne valide après suppression des NaN.", file=sys.stderr)
        sys.exit(1)

    # 4. Calcul des métriques
    print(f"\n[4/5] Calcul des métriques ({args.n_boot} tirages bootstrap)…")
    y_true = eval_df["y_true"].values.astype(float)
    q10 = eval_df["q10"].values.astype(float)
    q50 = eval_df["q50"].values.astype(float)
    q90 = eval_df["q90"].values.astype(float)
    y_naive = eval_df["y_naive"].values.astype(float)
    oracle_mean = eval_df["oracle_mean"].values.astype(float) if "oracle_mean" in eval_df.columns else None

    global_metrics = compute_metrics(y_true, q10, q50, q90, y_naive, oracle_mean, n_boot=args.n_boot)
    print(f"  WAPE modèle  : {_fmt(global_metrics['wape'])}")
    print(f"  WAPE naïf    : {_fmt(global_metrics['wape_naive'])}")
    print(f"  MASE         : {_fmt(global_metrics['mase'])}")
    print(f"  RMSSE        : {_fmt(global_metrics['rmsse'])}")
    print(f"  Biais        : {_fmt(global_metrics['bias'])}")
    print(f"  Couverture   : {_fmt(global_metrics['coverage_q10_q90'])}")
    print(f"  Efficacité   : {_fmt(global_metrics['efficiency'])}")
    print(f"  IC 95% WAPE  : {global_metrics['wape_ci_95']}")

    segment_metrics = compute_segment_metrics(eval_df)

    # 5. Sauvegarder metrics.json
    print(f"\n[5/5] Sauvegarde des résultats…")
    out_dir = os.path.dirname(os.path.abspath(args.out))
    os.makedirs(out_dir, exist_ok=True)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "git_hash": git_hash(),
        "data_hash": data_hash,
        "model_version": "demand_lightgbm_v1.0.0",
        "split": args.split,
        "global": global_metrics,
        **segment_metrics,
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"  metrics.json → {args.out}")

    # Rapport Markdown
    md_path = os.path.join(REPORTS_DIR, "model_evaluation_report.md")
    generate_markdown_report(output, md_path)

    print("\n✓ Évaluation terminée avec succès.")
    print(f"  Split          : {args.split}")
    print(f"  Lignes évalués : {len(eval_df)}")
    print(f"  WAPE final     : {_fmt(global_metrics['wape'])}")
    print(f"  MASE final     : {_fmt(global_metrics['mase'])}")


if __name__ == "__main__":
    main()
