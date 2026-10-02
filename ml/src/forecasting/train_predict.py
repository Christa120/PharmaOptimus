"""
ml/src/forecasting/train_predict.py
Entraînement et inférence des prévisions quantiles de la demande.

- Apprentissage global multi-séries avec LightGBM réel
- Objectifs : Tweedie (q50), quantile 0.10, quantile 0.90
- Calibration conforme (Conformalized Quantile Regression – CQR)
- Correction du biais de censure des jours de rupture
- Aucune fuite temporelle : shift avant chaque rolling, lags, expanding
"""

from __future__ import annotations

import math
import os
from typing import Optional

import numpy as np
import pandas as pd

try:
    import joblib as _joblib
except ImportError:
    _joblib = None

try:
    import lightgbm as lgb
    _HAS_LGB = True
except ImportError:
    _HAS_LGB = False

# ---------------------------------------------------------------------------
# Mapping produit → famille thérapeutique (entier, 0-based)
# ---------------------------------------------------------------------------
_PRODUCT_FAMILY = {
    "ACT": 0,   # antipaludéen
    "ARTINJ": 0,
    "SP": 0,
    "TDR": 0,
    "AMOX": 1,  # antibiotique
    "CEFT": 1,
    "ARV": 2,   # antirétroviral
    "BCG": 3,   # vaccin
    "PENTA": 3,
    "ROUG": 3,
    "INS": 4,   # antidiabétique
    "METF": 4,
    "AMLO": 5,  # cardiovasculaire
    "MGSO4": 6, # obstétrique
    "MISO": 6,
    "OXY": 6,
    "PARA": 7,  # antalgique/antipyrétique
    "RINGER": 8,  # solution perfusion
    "SRO": 9,   # réhydratation
    "ZINC": 10, # micronutriment
}

_PRODUCT_COLD_CHAIN = {
    "BCG": 1, "PENTA": 1, "ROUG": 1, "INS": 1,
}

_PRODUCT_CRITICALITY = {
    "ARV": 2, "INS": 2, "ARTINJ": 2, "MGSO4": 2,
    "ACT": 1, "AMOX": 1, "OXY": 1, "MISO": 1, "CEFT": 1, "BCG": 1, "PENTA": 1, "ROUG": 1,
    "SP": 0, "TDR": 0, "METF": 0, "AMLO": 0, "PARA": 0, "RINGER": 0, "SRO": 0, "ZINC": 0,
}

_FACILITY_TYPE_ORDER = {
    "central_depot": 4,
    "referral_hospital": 3,
    "pharmacy": 2,
    "health_center": 1,
}


class DemandForecaster:
    """
    Prévisions quantiles multi-séries (LightGBM global).

    Attributs après fit()
    ---------------------
    lgb_median_       : LGBMRegressor Tweedie (q50)
    lgb_q10_          : LGBMRegressor quantile 0.10
    lgb_q90_          : LGBMRegressor quantile 0.90
    feature_names_    : liste des noms de features
    cv_scores_        : liste des WAPE par pli de validation

    Attributs après calibrate_conformal()
    -------------------------------------
    cqr_offset_lo_    : offset inférieur (float)
    cqr_offset_hi_    : offset supérieur (float)
    empirical_coverage_ : couverture empirique (float 0-1)
    """

    def __init__(self, model_version: str = "demand_lightgbm_v1.0.0", seed: int = 42):
        if not _HAS_LGB:
            raise ImportError(
                "LightGBM n'est pas installé. Exécutez : pip install lightgbm"
            )
        self.model_version = model_version
        self.seed = seed

        self.lgb_median_: Optional[lgb.LGBMRegressor] = None
        self.lgb_q10_: Optional[lgb.LGBMRegressor] = None
        self.lgb_q90_: Optional[lgb.LGBMRegressor] = None
        self.feature_names_: list[str] = []
        self.cv_scores_: list[float] = []

        self.cqr_offset_lo_: float = 0.0
        self.cqr_offset_hi_: float = 0.0
        self.empirical_coverage_: float = 0.0

        # référence réseau (chargée depuis le CSV si disponible)
        self._network_df: Optional[pd.DataFrame] = None

    # ------------------------------------------------------------------
    # Fonctions internes
    # ------------------------------------------------------------------

    def _load_network(self) -> None:
        """Charge reseau_pilote_benin.csv une fois pour enrichir les features."""
        if self._network_df is not None:
            return
        candidate = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "geo", "reseau_pilote_benin.csv"
        )
        candidate = os.path.normpath(candidate)
        if os.path.isfile(candidate):
            self._network_df = pd.read_csv(candidate)
        else:
            # chemin relatif alternatif (exécution depuis la racine du projet)
            candidate2 = "data/geo/reseau_pilote_benin.csv"
            if os.path.isfile(candidate2):
                self._network_df = pd.read_csv(candidate2)

    def _merge_facility_info(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ajoute type_ord, has_cold_chain, log_population à df (sans doublon)."""
        self._load_network()
        if self._network_df is None:
            df["type_ord"] = 1
            df["facility_has_cold_chain"] = 0
            df["log_pop"] = 10.0
            return df

        net = self._network_df[["id", "type", "has_cold_chain", "served_population"]].copy()
        net["type_ord"] = net["type"].map(_FACILITY_TYPE_ORDER).fillna(1).astype(int)
        net["facility_has_cold_chain"] = net["has_cold_chain"].fillna(0).astype(int)
        net["log_pop"] = np.log1p(net["served_population"].fillna(0))
        net = net[["id", "type_ord", "facility_has_cold_chain", "log_pop"]].rename(
            columns={"id": "facility_id"}
        )
        # éviter les doublons si les colonnes existent déjà
        for col in ["type_ord", "facility_has_cold_chain", "log_pop"]:
            if col in df.columns:
                df = df.drop(columns=[col])
        df = df.merge(net, on="facility_id", how="left")
        df["type_ord"] = df["type_ord"].fillna(1).astype(int)
        df["facility_has_cold_chain"] = df["facility_has_cold_chain"].fillna(0).astype(int)
        df["log_pop"] = df["log_pop"].fillna(10.0)
        return df

    @staticmethod
    def _merge_weather(df: pd.DataFrame, weather_df: Optional[pd.DataFrame]) -> pd.DataFrame:
        """Ajoute rain_mm et temp_mean_c retardés de 4 semaines (via département)."""
        if weather_df is None or weather_df.empty:
            df["lag_rain_4"] = 0.0
            df["lag_temp_4"] = 25.0
            return df

        # On a besoin du département dans df ; on l'obtient depuis reseau_pilote si absent
        if "department" not in df.columns:
            net_path = "data/geo/reseau_pilote_benin.csv"
            if os.path.isfile(net_path):
                net = pd.read_csv(net_path)[["id", "department"]].rename(
                    columns={"id": "facility_id"}
                )
                df = df.merge(net, on="facility_id", how="left")
            else:
                df["department"] = "Littoral"

        w = weather_df[["week_start", "department", "rain_mm", "temp_mean_c"]].copy()
        w["week_start"] = pd.to_datetime(w["week_start"])
        w = w.groupby(["week_start", "department"], as_index=False).mean(numeric_only=True)
        w["week_shifted"] = w.groupby("department")["week_start"].transform(
            lambda x: x + pd.Timedelta(weeks=4)
        )
        w = w.rename(columns={"week_shifted": "week_join", "rain_mm": "lag_rain_4", "temp_mean_c": "lag_temp_4"})
        w = w[["week_join", "department", "lag_rain_4", "lag_temp_4"]]

        df["week_start"] = pd.to_datetime(df["week_start"])
        df = df.merge(w, left_on=["week_start", "department"], right_on=["week_join", "department"], how="left")
        df = df.drop(columns=["week_join"], errors="ignore")
        df["lag_rain_4"] = df["lag_rain_4"].fillna(0.0)
        df["lag_temp_4"] = df["lag_temp_4"].fillna(25.0)
        return df

    # ------------------------------------------------------------------
    # API publique : build_features
    # ------------------------------------------------------------------

    def build_features(
        self, df: pd.DataFrame, weather_df: Optional[pd.DataFrame] = None
    ) -> tuple[pd.DataFrame, pd.Series]:
        """
        Construit X (features) et y (cible) sans aucune fuite temporelle.

        Paramètres
        ----------
        df : DataFrame avec colonnes week_start, facility_id, product_id,
             qty_dispensed, stockout_days. Peut contenir d'autres colonnes.
        weather_df : DataFrame optionnel avec week_start, department, rain_mm, temp_mean_c.

        Retourne
        --------
        X : pd.DataFrame des features (sans NaN → dropna)
        y : pd.Series de la cible (qty_adjusted)
        """
        feat = df.copy()
        feat["week_start"] = pd.to_datetime(feat["week_start"])
        feat = feat.sort_values(["facility_id", "product_id", "week_start"])

        # --- Correction censure ---
        sd = feat["stockout_days"].fillna(0).clip(0, 6)
        feat["qty_adjusted"] = feat["qty_dispensed"] * (7.0 / (7.0 - sd).clip(lower=1.0))

        # --- Lags de qty_adjusted (shift AVANT d'utiliser, jamais de fuite) ---
        grp = feat.groupby(["facility_id", "product_id"])["qty_adjusted"]
        for lag in [1, 2, 3, 4, 8, 13, 26, 52]:
            feat[f"lag_{lag}w"] = grp.shift(lag)

        # --- Rolling (shift 1 avant rolling pour éviter la fuite) ---
        for window in [4, 8, 13]:
            shifted = grp.shift(1)
            feat[f"roll_mean_{window}w"] = shifted.transform(
                lambda x, w=window: x.rolling(w, min_periods=1).mean()
            )
            feat[f"roll_std_{window}w"] = shifted.transform(
                lambda x, w=window: x.rolling(w, min_periods=2).std().fillna(0)
            )

        # --- Zero ratio sur 13 semaines passées ---
        def _zero_ratio(s: pd.Series) -> pd.Series:
            shifted = s.shift(1)
            return shifted.transform(
                lambda x: (x == 0).rolling(13, min_periods=1).mean()
            )
        feat["zero_ratio_13w"] = feat.groupby(["facility_id", "product_id"])["qty_adjusted"].transform(
            lambda x: x.shift(1).transform(lambda y: (y == 0).rolling(13, min_periods=1).mean())
        )

        # --- Semaines depuis dernière valeur non nulle ---
        def _weeks_since_nonzero(s: pd.Series) -> pd.Series:
            cumcount = pd.Series(range(len(s)), index=s.index)
            last_nz = cumcount.where(s > 0).ffill().fillna(-1)
            return cumcount - last_nz

        feat["weeks_since_nonzero"] = feat.groupby(["facility_id", "product_id"])["qty_adjusted"].transform(
            lambda x: _weeks_since_nonzero(x.shift(1).fillna(0))
        )

        # --- Calendrier ---
        woy = feat["week_start"].dt.isocalendar().week.astype(float)
        feat["sin_week"] = np.sin(2 * math.pi * woy / 52.0)
        feat["cos_week"] = np.cos(2 * math.pi * woy / 52.0)
        feat["month"] = feat["week_start"].dt.month

        # --- Variables établissement ---
        feat = self._merge_facility_info(feat)

        # --- Variables produit ---
        feat["product_family"] = feat["product_id"].map(_PRODUCT_FAMILY).fillna(99).astype(int)
        feat["product_cold_chain"] = feat["product_id"].map(_PRODUCT_COLD_CHAIN).fillna(0).astype(int)
        feat["product_criticality"] = feat["product_id"].map(_PRODUCT_CRITICALITY).fillna(0).astype(int)

        # --- Encodage entier facility_id et product_id ---
        if not hasattr(self, "_fac_enc"):
            self._fac_enc: dict = {f: i for i, f in enumerate(sorted(feat["facility_id"].unique()))}
        if not hasattr(self, "_prod_enc"):
            self._prod_enc: dict = {p: i for i, p in enumerate(sorted(feat["product_id"].unique()))}
        feat["fac_enc"] = feat["facility_id"].map(self._fac_enc).fillna(-1).astype(int)
        feat["prod_enc"] = feat["product_id"].map(self._prod_enc).fillna(-1).astype(int)

        # --- Agrégat hiérarchique : demande moyenne produit (expanding, passé uniquement) ---
        feat["prod_dept_mean"] = feat.groupby(["product_id", "department"] if "department" in feat.columns else ["product_id"])["qty_adjusted"].transform(
            lambda x: x.shift(1).expanding(min_periods=1).mean()
        )

        # --- Météo ---
        feat = self._merge_weather(feat, weather_df)

        # --- Sélection des features finales ---
        feature_cols = (
            [f"lag_{l}w" for l in [1, 2, 3, 4, 8, 13, 26, 52]]
            + [f"roll_mean_{w}w" for w in [4, 8, 13]]
            + [f"roll_std_{w}w" for w in [4, 8, 13]]
            + ["zero_ratio_13w", "weeks_since_nonzero"]
            + ["sin_week", "cos_week", "month"]
            + ["type_ord", "facility_has_cold_chain", "log_pop"]
            + ["product_family", "product_cold_chain", "product_criticality"]
            + ["fac_enc", "prod_enc"]
            + ["prod_dept_mean"]
            + ["lag_rain_4", "lag_temp_4"]
        )

        target_col = "qty_adjusted"

        # Supprimer les lignes sans données suffisantes (les premières semaines sans lags)
        required = feature_cols + [target_col]
        feat_clean = feat[required].dropna()

        X = feat_clean[feature_cols].reset_index(drop=True)
        y = feat_clean[target_col].reset_index(drop=True)

        return X, y

    # ------------------------------------------------------------------
    # API publique : fit
    # ------------------------------------------------------------------

    def fit(
        self,
        df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        n_folds: int = 4,
    ) -> "DemandForecaster":
        """
        Entraîne 3 modèles LightGBM réels avec validation temporelle glissante.
        """
        df = df.copy()
        df["week_start"] = pd.to_datetime(df["week_start"])
        df = df.sort_values("week_start")

        X_all, y_all = self.build_features(df, weather_df)
        self.feature_names_ = list(X_all.columns)

        # --- Validation temporelle glissante (TimeSeriesSplit manuel) ---
        n = len(X_all)
        fold_size = n // (n_folds + 1)
        cv_wapes: list[float] = []

        base_params = dict(
            n_estimators=200,
            num_leaves=31,
            learning_rate=0.05,
            feature_fraction=0.8,
            bagging_fraction=0.8,
            bagging_freq=5,
            min_child_samples=20,
            random_state=self.seed,
            verbose=-1,
        )

        print(f"  Validation glissante ({n_folds} plis, horizon 8 semaines par pli)…")
        for fold in range(n_folds):
            train_end = fold_size * (fold + 1)
            val_start = train_end
            val_end = min(train_end + 8 * 53, n)  # 8 sem × ~53 séries

            if val_end <= val_start or train_end < 100:
                continue

            X_tr, y_tr = X_all.iloc[:train_end], y_all.iloc[:train_end]
            X_val, y_val = X_all.iloc[val_start:val_end], y_all.iloc[val_start:val_end]

            m_fold = lgb.LGBMRegressor(
                objective="tweedie", tweedie_variance_power=1.5, **base_params
            )
            m_fold.fit(X_tr, y_tr)
            pred_val = m_fold.predict(X_val)

            mask = y_val > 0
            if mask.sum() > 0:
                wape = float(np.abs(pred_val[mask] - y_val[mask]).sum() / y_val[mask].sum())
            else:
                wape = float(np.abs(pred_val - y_val).mean())
            cv_wapes.append(wape)
            print(f"    Pli {fold + 1}/{n_folds} — WAPE={wape:.4f} (train={train_end}, val={val_end - val_start})")

        self.cv_scores_ = cv_wapes
        cv_mean = float(np.mean(cv_wapes)) if cv_wapes else float("nan")
        cv_std = float(np.std(cv_wapes)) if cv_wapes else float("nan")
        print(f"  CV WAPE moyen : {cv_mean:.4f} ± {cv_std:.4f}")

        # --- Entraînement final sur toutes les données ---
        print("  Entraînement final (3 modèles) sur toutes les données…")

        self.lgb_median_ = lgb.LGBMRegressor(
            objective="tweedie", tweedie_variance_power=1.5, **base_params
        )
        self.lgb_median_.fit(X_all, y_all)

        self.lgb_q10_ = lgb.LGBMRegressor(
            objective="quantile", alpha=0.1, **base_params
        )
        self.lgb_q10_.fit(X_all, y_all)

        self.lgb_q90_ = lgb.LGBMRegressor(
            objective="quantile", alpha=0.9, **base_params
        )
        self.lgb_q90_.fit(X_all, y_all)

        print(f"  Entraînement terminé. Features : {len(self.feature_names_)}, lignes : {len(X_all)}")
        return self

    # ------------------------------------------------------------------
    # API publique : calibrate_conformal
    # ------------------------------------------------------------------

    def calibrate_conformal(
        self,
        val_df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        context_df: Optional[pd.DataFrame] = None,
    ) -> "DemandForecaster":
        """
        Calibration CQR (Conformalized Quantile Regression).
        Calcule les offsets qui garantissent une couverture empirique proche de 80%.

        Paramètres
        ----------
        val_df      : jeu de calibration (semaines cibles).
        weather_df  : données météo optionnelles.
        context_df  : données historiques précédant val_df (nécessaire pour les lags).
                      Si fourni, val_df est concaténé après context_df pour construire
                      les features, puis seules les lignes de val_df sont utilisées.
        """
        if context_df is not None and len(context_df) > 0:
            combined = pd.concat([context_df, val_df], ignore_index=True)
            combined["week_start"] = pd.to_datetime(combined["week_start"])
            val_df = val_df.copy()
            val_df["week_start"] = pd.to_datetime(val_df["week_start"])
            val_week_min = val_df["week_start"].min()
            val_week_max = val_df["week_start"].max()

            X_combined, y_combined = self.build_features(combined, weather_df)

            # Reconstruire les indices pour filtrer
            combined_sorted = combined.sort_values(["facility_id", "product_id", "week_start"])
            combined_sorted = combined_sorted.copy()
            sd = combined_sorted["stockout_days"].fillna(0).clip(0, 6)
            combined_sorted["qty_adjusted"] = combined_sorted["qty_dispensed"] * (
                7.0 / (7.0 - sd).clip(lower=1.0)
            )
            grp_ctx = combined_sorted.groupby(["facility_id", "product_id"])["qty_adjusted"]
            combined_sorted["lag_1w"] = grp_ctx.shift(1)
            ctx_valid = combined_sorted.dropna(subset=["lag_1w"]).reset_index(drop=True)

            n_valid = min(len(X_combined), len(ctx_valid))
            weeks_valid = pd.to_datetime(ctx_valid["week_start"].values[:n_valid])
            val_mask = (weeks_valid >= val_week_min) & (weeks_valid <= val_week_max)

            if val_mask.sum() == 0:
                print("  AVERTISSEMENT : aucune ligne de calibration après alignement. CQR ignoré.")
                return self

            X_combined_sub = X_combined.iloc[:n_valid].reset_index(drop=True)
            X_val = X_combined_sub[val_mask]
            y_val_arr = y_combined.values[:n_valid][val_mask]
        else:
            X_val, y_val_tmp = self.build_features(val_df, weather_df)
            y_val_arr = y_val_tmp.values

        if len(X_val) == 0:
            print("  AVERTISSEMENT : jeu de calibration vide après construction des features. CQR ignoré.")
            return self

        q10_pred = np.maximum(0, self.lgb_q10_.predict(X_val))
        q90_pred = np.maximum(0, self.lgb_q90_.predict(X_val))
        y_arr = y_val_arr  # already a numpy array

        # Résidus conformes
        r_lo = q10_pred - y_arr           # positif → q10 trop élevé
        r_hi = y_arr - q90_pred           # positif → q90 trop bas

        self.cqr_offset_lo_ = float(np.quantile(r_lo, 0.90))
        self.cqr_offset_hi_ = float(np.quantile(r_hi, 0.90))

        q10_corr = np.maximum(0, q10_pred - self.cqr_offset_lo_)
        q90_corr = np.maximum(0, q90_pred + self.cqr_offset_hi_)
        self.empirical_coverage_ = float(np.mean((q10_corr <= y_arr) & (y_arr <= q90_corr)))

        print(
            f"  CQR — offset_lo={self.cqr_offset_lo_:.3f}, offset_hi={self.cqr_offset_hi_:.3f}, "
            f"couverture empirique={self.empirical_coverage_:.4f}"
        )
        return self

    # ------------------------------------------------------------------
    # API publique : predict
    # ------------------------------------------------------------------

    def predict(
        self,
        df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        horizon: int = 1,
    ) -> pd.DataFrame:
        """
        Prédictions quantiles pour chaque ligne de df.

        Retourne un DataFrame avec colonnes :
          facility_id, product_id, week_start, horizon_weeks, q10, q50, q90, model_version
        """
        X, _ = self.build_features(df, weather_df)

        q10_raw = np.maximum(0, self.lgb_q10_.predict(X))
        q50_raw = np.maximum(0, self.lgb_median_.predict(X))
        q90_raw = np.maximum(0, self.lgb_q90_.predict(X))

        q10 = np.maximum(0, q10_raw - self.cqr_offset_lo_)
        q90 = np.maximum(0, q90_raw + self.cqr_offset_hi_)
        q50 = q50_raw

        # Assurer la cohérence des quantiles
        q10 = np.minimum(q10, q50)
        q90 = np.maximum(q90, q50)

        # Récupérer les identifiants depuis df (aligner sur les lignes non-NaN de build_features)
        df_tmp = df.copy()
        df_tmp["week_start"] = pd.to_datetime(df_tmp["week_start"])
        df_tmp = df_tmp.sort_values(["facility_id", "product_id", "week_start"])

        feature_cols = self.feature_names_
        target_col = "qty_adjusted"
        sd = df_tmp["stockout_days"].fillna(0).clip(0, 6)
        df_tmp["qty_adjusted"] = df_tmp["qty_dispensed"] * (7.0 / (7.0 - sd).clip(lower=1.0))

        # Reconstruire les features pour obtenir les indices valides
        X_check, _ = self.build_features(df, weather_df)
        # Obtenir les lignes valides en recalculant
        feat_all = df_tmp.copy()
        grp = feat_all.groupby(["facility_id", "product_id"])["qty_adjusted"]
        for lag in [1, 2, 3, 4, 8, 13, 26, 52]:
            feat_all[f"lag_{lag}w"] = grp.shift(lag)
        required_lag = ["lag_1w"]
        feat_all_clean = feat_all.dropna(subset=required_lag)
        # Alignement par index
        ids_df = feat_all_clean[["facility_id", "product_id", "week_start"]].reset_index(drop=True)

        n = len(q10)
        if len(ids_df) > n:
            ids_df = ids_df.iloc[:n].reset_index(drop=True)
        elif len(ids_df) < n:
            n = len(ids_df)
            q10, q50, q90 = q10[:n], q50[:n], q90[:n]

        result = pd.DataFrame({
            "facility_id": ids_df["facility_id"].values,
            "product_id": ids_df["product_id"].values,
            "week_start": ids_df["week_start"].values,
            "horizon_weeks": horizon,
            "q10": np.round(q10, 2),
            "q50": np.round(q50, 2),
            "q90": np.round(q90, 2),
            "model_version": self.model_version,
        })

        return result

    # ------------------------------------------------------------------
    # Sérialisation
    # ------------------------------------------------------------------

    def save(self, path: str) -> None:
        if _joblib is None:
            raise ImportError("joblib est requis pour sauvegarder le modèle.")
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        _joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> "DemandForecaster":
        if _joblib is None:
            raise ImportError("joblib est requis pour charger le modèle.")
        return _joblib.load(path)
