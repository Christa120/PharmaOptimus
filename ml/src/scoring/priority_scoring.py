"""
ml/src/scoring/priority_scoring.py
Calcul transparent et auditable du Score de Priorité d'intervention des établissements.
Formule officielle :
  Priorité = 100 * (0.40 * R + 0.25 * C + 0.20 * P + 0.15 * T)
"""

import math

try:
    import numpy as np
except ImportError:
    np = None

def compute_priority_score(days_of_cover, vital_danger_ratio, served_population, last_delivery_days_ago):
    """
    Calcule le score de priorité sur une échelle de 0 à 100 points.
    
    Paramètres :
    - days_of_cover : Jours de couverture du stock minimum parmi les produits traceurs
    - vital_danger_ratio : Proportion de médicaments vitaux en tension (< 14 jours de couverture)
    - served_population : Bassin de population desservi par la structure
    - last_delivery_days_ago : Nombre de jours écoulés depuis le dernier passage d'un convoi
    """
    # R : Risque de rupture (normalisé sur [0, 1])
    # 0 jour = risque maximal 1.0 ; >= 30 jours = risque nul 0.0
    r_score = max(0.0, min(1.0, (30.0 - float(days_of_cover)) / 30.0))

    # C : Criticité clinique
    c_score = max(0.0, min(1.0, float(vital_danger_ratio)))

    # P : Population desservie (logarithme normalisé sur [0, 1] entre 20 000 et 1 000 000 hab.)
    min_log = math.log(20000.0)
    max_log = math.log(1000000.0)
    clamped_pop = max(20000.0, min(1000000.0, float(served_population)))
    p_score = (math.log(clamped_pop) - min_log) / (max_log - min_log)
    p_score = max(0.0, min(1.0, p_score))

    # T : Délai sans livraison (normalisé sur 35 jours maximum)
    t_score = max(0.0, min(1.0, float(last_delivery_days_ago) / 35.0))

    # Pondérations contractuelles
    w1, w2, w3, w4 = 0.40, 0.25, 0.20, 0.15

    raw_total = (w1 * r_score + w2 * c_score + w3 * p_score + w4 * t_score) * 100.0
    final_score = int(round(max(0.0, min(100.0, raw_total))))

    breakdown = {
        "stockout_risk_pts": round(w1 * r_score * 100, 1),
        "clinical_criticality_pts": round(w2 * c_score * 100, 1),
        "population_scale_pts": round(w3 * p_score * 100, 1),
        "time_since_delivery_pts": round(w4 * t_score * 100, 1),
        "total_score": final_score
    }

    return final_score, breakdown
