"""
data/simulator/generator.py
Générateur de séries stochastiques de consommation, de stocks et de commandes pour le Bénin.
Conforme aux spécifications de la section 6.4 :
- Loi binomiale négative (sur-dispersion réaliste)
- Gradient climatique Sud (bimodal) / Nord (unimodal)
- Respect absolu de l'équation de conservation des stocks
- Marquage systématique is_simulated = True
"""

import os
import math
from datetime import datetime, timedelta
import random

try:
    import yaml
except ImportError:
    yaml = None

try:
    import numpy as np
    import pandas as pd
except ImportError:
    np = None
    pd = None

def load_params(config_path="data/simulator/params.yaml"):
    if yaml is not None and os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {
        "simulation": {"seed": 42, "start_date": "2024-01-01", "end_date": "2026-09-30"},
        "logistics": {"safety_stock_days": 21, "detour_factor": 1.4}
    }

class BeninPharmaSimulator:
    def __init__(self, seed=42):
        self.seed = seed
        self.random = random.Random(seed)
        if np is not None:
            self.rng = np.random.default_rng(seed)
        else:
            self.rng = None
        self.params = load_params()

    def _sample_negbin(self, mean_val, p_param=0.4):
        """Échantillonnage loi binomiale négative (avec fallback pure-Python)."""
        if self.rng is not None:
            n_param = max(1, int(mean_val * p_param / (1.0 - p_param)))
            return int(self.rng.negative_binomial(n_param, p_param))
        else:
            # Fallback Poisson/Normal avec sur-dispersion via gamma
            r = max(1.0, mean_val * p_param / (1.0 - p_param))
            # Loi gamma(r, (1-p)/p)
            lam = self.random.gammavariate(r, (1.0 - p_param) / p_param)
            # Poisson(lam) via inversion
            k = 0
            p = 1.0
            L = math.exp(-min(500.0, lam))
            while p > L and k < 5000:
                k += 1
                p *= self.random.random()
            return max(0, k - 1)

    def generate_synthetic_history(self, facilities_df, products_df, weeks_count=140):
        """
        Génère l'historique complet hebdomadaire pour toutes les structures sanitaires
        et les produits traceurs du Bénin.
        Fonctionne avec des DataFrames Pandas ou des listes de dictionnaires Python standard.
        """
        records = []
        base_date = datetime.strptime(self.params["simulation"]["start_date"], "%Y-%m-%d")

        # Conversion unifiée en liste de dictionnaires
        if hasattr(facilities_df, "to_dict"):
            fac_list = facilities_df.to_dict(orient="records")
        elif isinstance(facilities_df, list):
            fac_list = facilities_df
        else:
            fac_list = list(facilities_df)

        if hasattr(products_df, "to_dict"):
            prod_list = products_df.to_dict(orient="records")
        elif isinstance(products_df, list):
            prod_list = products_df
        else:
            prod_list = list(products_df)

        for fac in fac_list:
            is_north = fac.get("department") in ["Alibori", "Atacora", "Borgou", "Donga"]
            pop_scale = max(0.2, float(fac.get("served_population", 50000)) / 100000.0)

            for prod in prod_list:
                # Vérification compatibilité chaîne du froid
                if prod.get("requires_cold_chain") and not fac.get("has_cold_chain") and fac.get("type") != "central_depot":
                    continue

                # Consommation de base
                base_weekly = (80 if prod.get("criticality") == "vital" else 45) * pop_scale
                current_stock = int(base_weekly * 6) # Stock de départ (6 semaines)

                for w in range(weeks_count):
                    week_start = (base_date + timedelta(weeks=w)).strftime("%Y-%m-%d")
                    week_of_year = (w % 52) + 1

                    # Facteur saisonnier (pluies pour antipaludiques, Harmattan pour amox)
                    seasonal_factor = 1.0
                    inn = prod.get("inn_name", "")
                    if "Artéméther" in inn or "CTA" in inn:
                        if is_north:
                            # Pic unique Nord (Juillet - Octobre)
                            seasonal_factor = 1.0 + 0.85 * math.exp(-((week_of_year - 33) ** 2) / 36.0)
                        else:
                            # Double pic Sud (Mai-Juin puis Octobre-Novembre)
                            seasonal_factor = 1.0 + 0.5 * math.exp(-((week_of_year - 22) ** 2) / 25.0) + 0.4 * math.exp(-((week_of_year - 43) ** 2) / 20.0)
                    elif "Amoxicilline" in inn:
                        # Poussières de l'Harmattan (Décembre - Février)
                        if week_of_year in [48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7]:
                            seasonal_factor = 1.40

                    mean_demand = max(2.0, base_weekly * seasonal_factor)
                    demande_reelle = self._sample_negbin(mean_demand)

                    # Équation de stock : dispensé = min(demande, stock_dispo)
                    dispense = min(demande_reelle, current_stock)
                    stockout_days = 0
                    if demande_reelle > current_stock:
                        # Consommation censurée
                        shortage_ratio = (demande_reelle - current_stock) / max(1, demande_reelle)
                        stockout_days = min(7, int(math.ceil(shortage_ratio * 7.0)))

                    # Réapprovisionnement régulier ou livraison d'urgence
                    receptions = 0
                    rnd_val = self.rng.random() if self.rng is not None else self.random.random()
                    if current_stock < base_weekly * 2 and rnd_val > 0.35:
                        receptions = int(base_weekly * 4)

                    # Mise à jour de l'équation de stock
                    current_stock = max(0, current_stock - dispense + receptions)

                    records.append({
                        "week_start": week_start,
                        "facility_id": fac["id"],
                        "product_id": prod["id"],
                        "qty_demanded_latent": demande_reelle, # Vérité terrain cachée
                        "qty_dispensed": dispense, # Donnée observée
                        "stockout_days": stockout_days, # Jours de rupture (censure)
                        "qty_on_hand": current_stock,
                        "receptions": receptions,
                        "is_simulated": True
                    })

        if pd is not None:
            return pd.DataFrame(records)
        return records

    def advance_one_week(self, current_state):
        """
        Mode 'advance' pour la démonstration : simule une semaine supplémentaire
        à partir de l'état terminal de l'historique.
        """
        if pd is not None and isinstance(current_state, pd.DataFrame):
            advanced_df = current_state.copy()
            for idx, row in advanced_df.iterrows():
                noise = self.random.gauss(1.0, 0.15)
                new_dispense = int(max(0, row["qty_dispensed"] * noise))
                new_stock = max(0, row["qty_on_hand"] - new_dispense)
                if new_stock < row["qty_dispensed"]:
                    new_stock += int(row["qty_dispensed"] * 4)
                advanced_df.at[idx, "qty_on_hand"] = new_stock
                advanced_df.at[idx, "qty_dispensed"] = new_dispense
            return advanced_df
        else:
            advanced = []
            for item in current_state:
                row = dict(item)
                noise = self.random.gauss(1.0, 0.15)
                new_dispense = int(max(0, row["qty_dispensed"] * noise))
                new_stock = max(0, row["qty_on_hand"] - new_dispense)
                if new_stock < row["qty_dispensed"]:
                    new_stock += int(row["qty_dispensed"] * 4)
                row["qty_on_hand"] = new_stock
                row["qty_dispensed"] = new_dispense
                advanced.append(row)
            return advanced

if __name__ == "__main__":
    print("Initialisation du simulateur Bénin...")
    sim = BeninPharmaSimulator()
    print("Simulateur prêt (seed=42, is_simulated=True).")
