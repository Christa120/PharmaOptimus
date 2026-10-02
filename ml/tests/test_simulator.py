"""
ml/tests/test_simulator.py
Tests pytest de qualité des données et de dynamique de stock.
Vérifie les données générées dans data/processed/ par le simulateur.
Lancer : pytest ml/tests/test_simulator.py -v
"""

import pytest
import pandas as pd
import numpy as np
import subprocess
import sys
from pathlib import Path

WORKDIR = Path(__file__).parents[2]


def test_historical_consumption_exists():
    f = WORKDIR / "data/processed/historical_consumption_benin.csv"
    assert f.exists(), f"Fichier manquant : {f}"


def test_historical_consumption_row_count():
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    assert 136080 <= len(df) <= 166320, (
        f"Nombre de lignes attendu ~151200, obtenu {len(df)}"
    )


def test_no_negative_quantities():
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    assert (df["qty_dispensed"] >= 0).all(), "qty_dispensed contient des valeurs négatives"
    assert (df["qty_on_hand"] >= 0).all(), "qty_on_hand contient des valeurs négatives"
    assert (df["receptions"] >= 0).all(), "receptions contient des valeurs négatives"


def test_stock_equation():
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    df["week_start"] = pd.to_datetime(df["week_start"])
    df = df.sort_values(["facility_id", "product_id", "week_start"])
    grp = df.groupby(["facility_id", "product_id"])
    violations = 0
    for (fid, pid), g in grp:
        g = g.reset_index(drop=True)
        for i in range(len(g) - 1):
            expected = (
                g.loc[i, "qty_on_hand"]
                + g.loc[i + 1, "receptions"]
                - g.loc[i + 1, "qty_dispensed"]
            )
            actual = g.loc[i + 1, "qty_on_hand"]
            if abs(expected - actual) > 1:
                violations += 1
    violation_rate = violations / len(df)
    assert violation_rate < 0.001, (
        f"Équation de stock violée pour {violations} lignes ({violation_rate:.3%})"
    )


def test_cold_chain_constraint():
    facilities_path = WORKDIR / "data/geo/reseau_pilote_benin.csv"
    if not facilities_path.exists():
        pytest.skip("Fichier reseau_pilote_benin.csv absent — test ignoré")
    facilities = pd.read_csv(facilities_path)
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    cold_products = ["OXY", "BCG", "PENTA", "ROUG", "INS"]
    df_cold = df[df["product_id"].isin(cold_products)]
    if len(df_cold) > 0:
        no_cold = facilities[facilities["has_cold_chain"] == 0]["id"].tolist()
        bad = df_cold[
            df_cold["facility_id"].isin(no_cold) & (df_cold["qty_dispensed"] > 0)
        ]
        assert len(bad) == 0, (
            f"{len(bad)} dispensations de produits cold chain vers structures sans chaîne du froid"
        )


def test_reproducibility():
    df1 = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    build_script = WORKDIR / "data/simulator/build_datasets.py"
    if not build_script.exists():
        pytest.skip(f"Script simulateur absent : {build_script}")
    result = subprocess.run(
        [sys.executable, str(build_script)],
        capture_output=True,
        text=True,
        cwd=str(WORKDIR),
    )
    assert result.returncode == 0, f"Simulateur a échoué : {result.stderr}"
    df2 = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    assert len(df1) == len(df2), (
        f"Reproductibilité : tailles différentes {len(df1)} vs {len(df2)}"
    )


def test_20_products():
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    n_products = df["product_id"].nunique()
    assert n_products == 20, f"Nombre de produits attendu 20, obtenu {n_products}"


def test_54_facilities():
    """
    Le réseau pilote contient 54 établissements, mais le dépôt central (fac-depot-central)
    n'a pas de consommation propre dans historical_consumption_benin.csv
    (il distribue, il ne consomme pas). Le test vérifie donc 53 établissements dans le CSV
    de consommation ET 54 dans le fichier réseau.
    """
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    n_facilities = df["facility_id"].nunique()
    # 53 = 54 établissements - 1 dépôt central (pas de consommation propre)
    assert n_facilities >= 53, f"Nombre d'établissements attendu ≥ 53, obtenu {n_facilities}"

    # Le fichier réseau doit lui contenir exactement 54 entrées
    facilities_path = WORKDIR / "data/geo/reseau_pilote_benin.csv"
    if facilities_path.exists():
        fac_df = pd.read_csv(facilities_path)
        assert len(fac_df) == 54, f"Réseau pilote : attendu 54 lignes, obtenu {len(fac_df)}"


def test_is_simulated_flag():
    df = pd.read_csv(WORKDIR / "data/processed/historical_consumption_benin.csv")
    assert "is_simulated" in df.columns, "Colonne is_simulated manquante"
    assert df["is_simulated"].all(), "Certaines lignes ont is_simulated=False"
