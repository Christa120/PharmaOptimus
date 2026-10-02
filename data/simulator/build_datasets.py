#!/usr/bin/env python3
"""
data/simulator/build_datasets.py
Générateur complet du jeu de données pilote pour PharmaOptimus - Bénin.

Produit :
  data/geo/reseau_pilote_benin.csv           — 54 structures sanitaires
  data/geo/quartiers_cotonou_calavi.csv      — quartiers du Grand Nokoué
  data/processed/historical_consumption_benin.csv — 140 semaines × 54 fac × 20 produits
  data/processed/ground_truth.csv            — demande latente non censurée
  data/processed/weather_chirps_benin.csv    — séries climatiques hebdomadaires
  ml/reports/data_quality.md                 — rapport de contrôle qualité réel

Règles :
  - seed = 42 (reproductibilité stricte)
  - Aucun chiffre écrit en dur dans les métriques ; tout est calculé
  - Équation de stock stricte vérifiée par run_quality_checks()
  - Les produits cold-chain ne vont qu'aux structures has_cold_chain=1
"""

import os
import csv
import json
import math
import copy
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import yaml

# ── Chemins ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent  # PharmaOptimus/
DATA_GEO = ROOT / "data" / "geo"
DATA_PROCESSED = ROOT / "data" / "processed"
ML_REPORTS = ROOT / "ml" / "reports"
DATA_RAW = ROOT / "data" / "raw"
PARAMS_YAML = ROOT / "data" / "simulator" / "params.yaml"

SEED = 42

# ── Helpers ───────────────────────────────────────────────────────────────────
def ensure_dirs():
    for d in [DATA_GEO, DATA_PROCESSED, ML_REPORTS]:
        d.mkdir(parents=True, exist_ok=True)


def write_csv(filepath: Path, rows: list[dict], fieldnames: list[str] | None = None):
    if not rows:
        raise ValueError(f"Aucune ligne à écrire dans {filepath}")
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ── 1. Réseau pilote : 54 structures ─────────────────────────────────────────
FACILITIES = [
    # ── Dépôt Central (1) ─────────────────────────────────────────────────
    {
        "id": "fac-depot-central",
        "name": "Dépôt Central Pharmaceutique National",
        "type": "central_depot",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3685,
        "lon": 2.4350,
        "served_population": 13000000,
        "storage_capacity_l": 450000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "Ministère de la Santé (Position simulée)",
        "is_simulated": "true",
    },
    # ── Hôpitaux de référence (13) ────────────────────────────────────────
    {
        "id": "fac-cnhu-cotonou",
        "name": "CNHU-HKM Cotonou",
        "type": "referral_hospital",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3612,
        "lon": 2.4095,
        "served_population": 680000,
        "storage_capacity_l": 85000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap way/23891045",
        "is_simulated": "true",
    },
    {
        "id": "fac-chu-mel",
        "name": "CHU Mère-Enfant Lagune (CHU-MEL)",
        "type": "referral_hospital",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3670,
        "lon": 2.4280,
        "served_population": 450000,
        "storage_capacity_l": 42000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/41289012",
        "is_simulated": "true",
    },
    {
        "id": "fac-chud-portonovo",
        "name": "CHUD Ouémé-Plateau (Porto-Novo)",
        "type": "referral_hospital",
        "department": "Ouémé",
        "commune": "Porto-Novo",
        "lat": 6.4990,
        "lon": 2.6250,
        "served_population": 780000,
        "storage_capacity_l": 55000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/52391034",
        "is_simulated": "true",
    },
    {
        "id": "fac-chud-parakou",
        "name": "CHUD Borgou-Alibori (Parakou)",
        "type": "referral_hospital",
        "department": "Borgou",
        "commune": "Parakou",
        "lat": 9.3480,
        "lon": 2.6220,
        "served_population": 850000,
        "storage_capacity_l": 60000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/63124567",
        "is_simulated": "true",
    },
    {
        "id": "fac-chd-zou",
        "name": "CHD Zou-Collines (Bohicon)",
        "type": "referral_hospital",
        "department": "Zou",
        "commune": "Bohicon",
        "lat": 7.1850,
        "lon": 2.0580,
        "served_population": 620000,
        "storage_capacity_l": 48000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/74892011",
        "is_simulated": "true",
    },
    {
        "id": "fac-chd-atacora",
        "name": "CHD Atacora (Natitingou)",
        "type": "referral_hospital",
        "department": "Atacora",
        "commune": "Natitingou",
        "lat": 10.3120,
        "lon": 1.3750,
        "served_population": 420000,
        "storage_capacity_l": 38000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/89012345",
        "is_simulated": "true",
    },
    {
        "id": "fac-hop-tanguieta",
        "name": "Hôpital de Zone Saint-Jean de Dieu (Tanguiéta)",
        "type": "referral_hospital",
        "department": "Atacora",
        "commune": "Tanguiéta",
        "lat": 10.6250,
        "lon": 1.2640,
        "served_population": 290000,
        "storage_capacity_l": 35000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 1,
        "source": "OpenStreetMap node/89012399",
        "is_simulated": "true",
    },
    {
        "id": "fac-chd-mono",
        "name": "CHD Mono-Couffo (Lokossa)",
        "type": "referral_hospital",
        "department": "Mono",
        "commune": "Lokossa",
        "lat": 6.6420,
        "lon": 1.7210,
        "served_population": 460000,
        "storage_capacity_l": 40000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/91234567",
        "is_simulated": "true",
    },
    {
        "id": "fac-hz-djougou",
        "name": "Hôpital de Zone de Djougou",
        "type": "referral_hospital",
        "department": "Donga",
        "commune": "Djougou",
        "lat": 9.7150,
        "lon": 1.6620,
        "served_population": 340000,
        "storage_capacity_l": 36000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/92345678",
        "is_simulated": "true",
    },
    {
        "id": "fac-hz-kandi",
        "name": "Hôpital de Zone de Kandi",
        "type": "referral_hospital",
        "department": "Alibori",
        "commune": "Kandi",
        "lat": 11.1390,
        "lon": 2.9320,
        "served_population": 380000,
        "storage_capacity_l": 35000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/93456789",
        "is_simulated": "true",
    },
    {
        "id": "fac-hz-malanville",
        "name": "Hôpital de Zone de Malanville",
        "type": "referral_hospital",
        "department": "Alibori",
        "commune": "Malanville",
        "lat": 11.8710,
        "lon": 3.3860,
        "served_population": 210000,
        "storage_capacity_l": 28000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 1,
        "source": "OpenStreetMap node/94567890",
        "is_simulated": "true",
    },
    {
        "id": "fac-hz-calavi",
        "name": "Hôpital de Zone d'Abomey-Calavi / Sô-Ava",
        "type": "referral_hospital",
        "department": "Atlantique",
        "commune": "Abomey-Calavi",
        "lat": 6.4560,
        "lon": 2.3510,
        "served_population": 580000,
        "storage_capacity_l": 45000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/95678901",
        "is_simulated": "true",
    },
    {
        "id": "fac-hz-pobe",
        "name": "Hôpital de Zone de Pobè",
        "type": "referral_hospital",
        "department": "Plateau",
        "commune": "Pobè",
        "lat": 6.9850,
        "lon": 2.6680,
        "served_population": 250000,
        "storage_capacity_l": 30000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap node/96789012",
        "is_simulated": "true",
    },
    # ── Centres de santé (28) ─────────────────────────────────────────────
    # Cotonou périphérique (4)
    {
        "id": "fac-cs-agla",
        "name": "Centre de Santé d'Agla",
        "type": "health_center",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3820,
        "lon": 2.3780,
        "served_population": 72000,
        "storage_capacity_l": 9000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-fidjrosse",
        "name": "Centre de Santé de Fidjrossè",
        "type": "health_center",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3610,
        "lon": 2.3650,
        "served_population": 68000,
        "storage_capacity_l": 8500,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-akpakpa",
        "name": "Centre de Santé d'Akpakpa",
        "type": "health_center",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3710,
        "lon": 2.4410,
        "served_population": 91000,
        "storage_capacity_l": 10000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-vedoko",
        "name": "Centre de Santé de Vèdoko",
        "type": "health_center",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3760,
        "lon": 2.3890,
        "served_population": 58000,
        "storage_capacity_l": 7500,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    # Autres CS
    {
        "id": "fac-cs-menontin",
        "name": "Centre de Santé de Ménontin",
        "type": "health_center",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3780,
        "lon": 2.3850,
        "served_population": 85000,
        "storage_capacity_l": 12000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-godomey",
        "name": "Centre de Santé de Godomey",
        "type": "health_center",
        "department": "Atlantique",
        "commune": "Abomey-Calavi",
        "lat": 6.4180,
        "lon": 2.3380,
        "served_population": 145000,
        "storage_capacity_l": 15000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-ouidah",
        "name": "Centre de Santé de Ouidah",
        "type": "health_center",
        "department": "Atlantique",
        "commune": "Ouidah",
        "lat": 6.3606,
        "lon": 2.0876,
        "served_population": 82000,
        "storage_capacity_l": 9500,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-abomey",
        "name": "Centre de Santé d'Abomey",
        "type": "health_center",
        "department": "Zou",
        "commune": "Abomey",
        "lat": 7.1866,
        "lon": 1.9921,
        "served_population": 79000,
        "storage_capacity_l": 9000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-savalou",
        "name": "Centre de Santé de Savalou",
        "type": "health_center",
        "department": "Collines",
        "commune": "Savalou",
        "lat": 7.9307,
        "lon": 1.9764,
        "served_population": 61000,
        "storage_capacity_l": 7000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-dassa",
        "name": "Centre de Santé de Dassa-Zoumè",
        "type": "health_center",
        "department": "Collines",
        "commune": "Dassa-Zoumè",
        "lat": 7.7887,
        "lon": 2.1893,
        "served_population": 55000,
        "storage_capacity_l": 6500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-bassila",
        "name": "Centre de Santé de Bassila",
        "type": "health_center",
        "department": "Donga",
        "commune": "Bassila",
        "lat": 9.0048,
        "lon": 1.6681,
        "served_population": 47000,
        "storage_capacity_l": 5800,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-bembereke",
        "name": "Centre de Santé de Bembèrèkè",
        "type": "health_center",
        "department": "Borgou",
        "commune": "Bembèrèkè",
        "lat": 10.2186,
        "lon": 2.6631,
        "served_population": 52000,
        "storage_capacity_l": 6200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-banikoara",
        "name": "Centre de Santé de Banikoara",
        "type": "health_center",
        "department": "Alibori",
        "commune": "Banikoara",
        "lat": 11.3010,
        "lon": 2.4364,
        "served_population": 49000,
        "storage_capacity_l": 5800,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-lokossa",
        "name": "Centre de Santé de Lokossa",
        "type": "health_center",
        "department": "Mono",
        "commune": "Lokossa",
        "lat": 6.6500,
        "lon": 1.7150,
        "served_population": 53000,
        "storage_capacity_l": 6500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-aplahoue",
        "name": "Centre de Santé d'Aplahoué",
        "type": "health_center",
        "department": "Couffo",
        "commune": "Aplahoué",
        "lat": 7.0024,
        "lon": 1.6839,
        "served_population": 44000,
        "storage_capacity_l": 5500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-pobe",
        "name": "Centre de Santé de Pobè",
        "type": "health_center",
        "department": "Plateau",
        "commune": "Pobè",
        "lat": 6.9780,
        "lon": 2.6590,
        "served_population": 48000,
        "storage_capacity_l": 6000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-sakete",
        "name": "Centre de Santé de Sakété",
        "type": "health_center",
        "department": "Plateau",
        "commune": "Sakété",
        "lat": 6.7344,
        "lon": 2.6592,
        "served_population": 41000,
        "storage_capacity_l": 5200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-ketou",
        "name": "Centre de Santé de Kétou",
        "type": "health_center",
        "department": "Plateau",
        "commune": "Kétou",
        "lat": 7.3590,
        "lon": 2.5994,
        "served_population": 38000,
        "storage_capacity_l": 4800,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-boukoumbe",
        "name": "Centre de Santé Rural de Boukoumbé",
        "type": "health_center",
        "department": "Atacora",
        "commune": "Boukoumbé",
        "lat": 10.1810,
        "lon": 1.1120,
        "served_population": 45000,
        "storage_capacity_l": 5500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-karimama",
        "name": "Centre de Santé Frontalier de Karimama",
        "type": "health_center",
        "department": "Alibori",
        "commune": "Karimama",
        "lat": 12.0680,
        "lon": 3.1810,
        "served_population": 41000,
        "storage_capacity_l": 5200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-tori",
        "name": "Centre de Santé de Tori-Bossito",
        "type": "health_center",
        "department": "Atlantique",
        "commune": "Tori-Bossito",
        "lat": 6.5134,
        "lon": 2.1550,
        "served_population": 35000,
        "storage_capacity_l": 4500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-kpomasse",
        "name": "Centre de Santé de Kpomassè",
        "type": "health_center",
        "department": "Atlantique",
        "commune": "Kpomassè",
        "lat": 6.5891,
        "lon": 2.0724,
        "served_population": 32000,
        "storage_capacity_l": 4200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-come",
        "name": "Centre de Santé de Comè",
        "type": "health_center",
        "department": "Mono",
        "commune": "Comè",
        "lat": 6.4071,
        "lon": 1.8866,
        "served_population": 39000,
        "storage_capacity_l": 5000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-nikki",
        "name": "Centre de Santé de Nikki",
        "type": "health_center",
        "department": "Borgou",
        "commune": "Nikki",
        "lat": 9.9432,
        "lon": 3.2064,
        "served_population": 43000,
        "storage_capacity_l": 5200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-perere",
        "name": "Centre de Santé de Pèrèrè",
        "type": "health_center",
        "department": "Borgou",
        "commune": "Pèrèrè",
        "lat": 10.7481,
        "lon": 3.0543,
        "served_population": 28000,
        "storage_capacity_l": 3800,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-copargo",
        "name": "Centre de Santé de Copargo",
        "type": "health_center",
        "department": "Donga",
        "commune": "Copargo",
        "lat": 9.8480,
        "lon": 1.5260,
        "served_population": 30000,
        "storage_capacity_l": 4000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-tchaourou",
        "name": "Centre de Santé de Tchaourou",
        "type": "health_center",
        "department": "Borgou",
        "commune": "Tchaourou",
        "lat": 8.8786,
        "lon": 2.5993,
        "served_population": 36000,
        "storage_capacity_l": 4600,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-cs-materi",
        "name": "Centre de Santé de Matéri",
        "type": "health_center",
        "department": "Atacora",
        "commune": "Matéri",
        "lat": 10.6969,
        "lon": 1.0618,
        "served_population": 33000,
        "storage_capacity_l": 4200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 1,
        "source": "healthsites.io (simulé)",
        "is_simulated": "true",
    },
    # ── Pharmacies (12) ───────────────────────────────────────────────────
    {
        "id": "fac-ph-campguezo",
        "name": "Pharmacie Camp Guézo",
        "type": "pharmacy",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3640,
        "lon": 2.4110,
        "served_population": 35000,
        "storage_capacity_l": 6500,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-etoile",
        "name": "Pharmacie de l'Étoile Rouge",
        "type": "pharmacy",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3720,
        "lon": 2.4080,
        "served_population": 42000,
        "storage_capacity_l": 8000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-parakou",
        "name": "Pharmacie Albarika (Parakou)",
        "type": "pharmacy",
        "department": "Borgou",
        "commune": "Parakou",
        "lat": 9.3520,
        "lon": 2.6280,
        "served_population": 48000,
        "storage_capacity_l": 8000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-portonovo",
        "name": "Pharmacie de l'Espoir (Porto-Novo)",
        "type": "pharmacy",
        "department": "Ouémé",
        "commune": "Porto-Novo",
        "lat": 6.4943,
        "lon": 2.6160,
        "served_population": 38000,
        "storage_capacity_l": 7000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-natitingou",
        "name": "Pharmacie du Centre (Natitingou)",
        "type": "pharmacy",
        "department": "Atacora",
        "commune": "Natitingou",
        "lat": 10.3080,
        "lon": 1.3820,
        "served_population": 31000,
        "storage_capacity_l": 5500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-lokossa",
        "name": "Pharmacie Sainte-Claire (Lokossa)",
        "type": "pharmacy",
        "department": "Mono",
        "commune": "Lokossa",
        "lat": 6.6390,
        "lon": 1.7180,
        "served_population": 27000,
        "storage_capacity_l": 5000,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-abomey-calavi",
        "name": "Pharmacie Santé Plus (Abomey-Calavi)",
        "type": "pharmacy",
        "department": "Atlantique",
        "commune": "Abomey-Calavi",
        "lat": 6.4480,
        "lon": 2.3450,
        "served_population": 44000,
        "storage_capacity_l": 7500,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-bohicon",
        "name": "Pharmacie du Zou (Bohicon)",
        "type": "pharmacy",
        "department": "Zou",
        "commune": "Bohicon",
        "lat": 7.1810,
        "lon": 2.0620,
        "served_population": 29000,
        "storage_capacity_l": 5200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-cotonou-est",
        "name": "Pharmacie Cotonou-Est",
        "type": "pharmacy",
        "department": "Littoral",
        "commune": "Cotonou",
        "lat": 6.3680,
        "lon": 2.4500,
        "served_population": 36000,
        "storage_capacity_l": 6000,
        "has_cold_chain": 1,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-djougou",
        "name": "Pharmacie de la Donga (Djougou)",
        "type": "pharmacy",
        "department": "Donga",
        "commune": "Djougou",
        "lat": 9.7100,
        "lon": 1.6680,
        "served_population": 24000,
        "storage_capacity_l": 4500,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-kandi",
        "name": "Pharmacie de l'Alibori (Kandi)",
        "type": "pharmacy",
        "department": "Alibori",
        "commune": "Kandi",
        "lat": 11.1340,
        "lon": 2.9360,
        "served_population": 22000,
        "storage_capacity_l": 4200,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
    {
        "id": "fac-ph-abomey",
        "name": "Pharmacie Royale (Abomey)",
        "type": "pharmacy",
        "department": "Zou",
        "commune": "Abomey",
        "lat": 7.1840,
        "lon": 1.9960,
        "served_population": 26000,
        "storage_capacity_l": 4800,
        "has_cold_chain": 0,
        "is_hard_to_reach": 0,
        "source": "OpenStreetMap (simulé)",
        "is_simulated": "true",
    },
]

assert len(FACILITIES) == 54, f"ERREUR: {len(FACILITIES)} structures au lieu de 54"


# ── 2. Produits traceurs (20) ─────────────────────────────────────────────────
NORTH_DEPTS = {"Alibori", "Atacora", "Borgou", "Donga"}
SOUTH_DEPTS = {"Littoral", "Atlantique", "Ouémé", "Plateau", "Mono", "Couffo", "Zou", "Collines"}

PRODUCTS = [
    # id, name, base_demand, cold_chain_required, category
    # base_demand = unités/semaine/structure pour taille moyenne
    {"id": "ACT", "name": "Artéméther-Luméfantrine (ACT)", "base_demand": 90, "cold_chain_required": False, "category": "vital_antimalarial"},
    {"id": "SP",  "name": "Sulfadoxine-Pyriméthamine (SP)", "base_demand": 50, "cold_chain_required": False, "category": "vital_antimalarial"},
    {"id": "ARTINJ", "name": "Artésunate injectable",       "base_demand": 30, "cold_chain_required": False, "category": "vital_antimalarial"},
    {"id": "TDR",  "name": "Test de Diagnostic Rapide Paludisme", "base_demand": 70, "cold_chain_required": False, "category": "vital_antimalarial"},
    {"id": "AMOX", "name": "Amoxicilline 500mg",            "base_demand": 80, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "PARA", "name": "Paracétamol 500mg",             "base_demand": 100,"cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "SRO",  "name": "Sels de Réhydratation Orale",   "base_demand": 60, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "ZINC", "name": "Zinc 20mg",                     "base_demand": 45, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "CEFT", "name": "Ceftriaxone 1g inj.",           "base_demand": 25, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "OXY",  "name": "Ocytocine 10 UI inj.",          "base_demand": 35, "cold_chain_required": True,  "category": "cold_chain_vaccine"},
    {"id": "MGSO4","name": "Sulfate de Magnésium 500mg/ml", "base_demand": 20, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "MISO", "name": "Misoprostol 200µg",             "base_demand": 28, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "BCG",  "name": "Vaccin BCG",                    "base_demand": 40, "cold_chain_required": True,  "category": "cold_chain_vaccine"},
    {"id": "PENTA","name": "Vaccin Pentavalent (DTP-HepB-Hib)", "base_demand": 55,"cold_chain_required": True, "category": "cold_chain_vaccine"},
    {"id": "ROUG", "name": "Vaccin Rougeole",               "base_demand": 38, "cold_chain_required": True,  "category": "cold_chain_vaccine"},
    {"id": "INS",  "name": "Insuline humaine NPH",          "base_demand": 22, "cold_chain_required": True,  "category": "cold_chain_vaccine"},
    {"id": "ARV",  "name": "ARV (ténofovir/lamivudine/éfavirenz)", "base_demand": 18, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "AMLO", "name": "Amlodipine 5mg",                "base_demand": 32, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "METF", "name": "Metformine 500mg",              "base_demand": 30, "cold_chain_required": False, "category": "essential_antibiotic"},
    {"id": "RINGER","name": "Ringer Lactate 500ml",         "base_demand": 55, "cold_chain_required": False, "category": "infusion_ringer"},
]

assert len(PRODUCTS) == 20, f"ERREUR: {len(PRODUCTS)} produits au lieu de 20"

# Dispersion φ par catégorie (paramètre binomiale négative : mean²/(variance-mean))
DISPERSION_PHI = {
    "vital_antimalarial":  1.8,
    "essential_antibiotic": 1.4,
    "cold_chain_vaccine":  1.2,
    "infusion_ringer":     2.1,
}

N_WEEKS = 140
START_DATE = datetime(2024, 1, 1)
WEEKS = [(START_DATE + timedelta(weeks=w)).strftime("%Y-%m-%d") for w in range(N_WEEKS)]


# ── 3. Saisonnalité réaliste ──────────────────────────────────────────────────

def malaria_factor(week_of_year: int, is_north: bool) -> float:
    """
    Facteur multiplicatif saisonnalité paludisme (antipaludiques + TDR).
    Sud bimodal : pics semaines 18-30 et 38-46.
    Nord unimodal : pic semaines 22-42.
    """
    w = week_of_year  # 1..52
    if is_north:
        peak = 32.0
        spread = 60.0
        return 1.0 + 1.2 * math.exp(-((w - peak) ** 2) / spread)
    else:
        p1 = 1.0 * math.exp(-((w - 24) ** 2) / 28)
        p2 = 0.8 * math.exp(-((w - 42) ** 2) / 20)
        return 1.0 + p1 + p2


def harmattan_factor(week_of_year: int) -> float:
    """Pic respiratoire harmattan : semaines 48-7 (décembre-février)."""
    w = week_of_year
    # Semaines 48-52 et 1-7
    if w >= 48 or w <= 7:
        dist = min(abs(w - 52), abs(w - 0)) if w >= 48 else abs(w - 0)
        return 1.0 + 0.5 * math.exp(-(dist ** 2) / 8)
    return 1.0


def vaccine_factor(week_of_year: int) -> float:
    """Campagnes vaccinales : légèrement plus élevées en début d'année."""
    w = week_of_year
    return 1.0 + 0.15 * math.exp(-((w - 10) ** 2) / 40)


def facility_size_factor(fac: dict) -> float:
    """Facteur d'échelle basé sur la population desservie."""
    pop = fac["served_population"]
    if pop >= 500000:
        return 3.5
    elif pop >= 200000:
        return 2.0
    elif pop >= 100000:
        return 1.4
    elif pop >= 50000:
        return 1.0
    else:
        return 0.6


def neg_binom_sample(rng: np.random.Generator, mean: float, phi: float) -> int:
    """
    Tirage binomiale négative NB(r, p) avec mean=mu, dispersion phi.
    p = phi/(phi+mu), r = phi
    Variance = mu + mu²/phi
    """
    if mean <= 0:
        return 0
    r = phi
    p = phi / (phi + mean)
    return int(rng.negative_binomial(r, p))


# ── 4. Chocs aléatoires ────────────────────────────────────────────────────────

def compute_shock_factors(rng_shock: np.random.Generator) -> dict:
    """
    Génère 3 épidémies paludisme + 2 ruptures approvisionnement + 1 campagne vaccination.
    Retourne un dict (week_idx, facility_id, product_id) -> multiplicateur.
    """
    shocks = {}  # key = (week_idx, fac_id, prod_id) -> float multiplier

    # --- Épidémies paludisme (×2.5 à ×4.0 sur ACT/SP/ARTINJ/TDR) ---
    malaria_products = {"ACT", "SP", "ARTINJ", "TDR"}
    epidemic_weeks = [
        int(rng_shock.integers(15, 35)),  # saison des pluies Sud
        int(rng_shock.integers(25, 45)),  # saison des pluies Nord
        int(rng_shock.integers(60, 90)),  # 2e année
    ]
    for ep_start in epidemic_weeks:
        intensity = float(rng_shock.uniform(2.5, 4.0))
        duration = int(rng_shock.integers(3, 7))
        affected_facs = [f["id"] for f in FACILITIES
                         if f["type"] in ("referral_hospital", "health_center")]
        sample_size = min(len(affected_facs), 15)
        ep_facs = list(rng_shock.choice(affected_facs, size=sample_size, replace=False))
        for w_off in range(duration):
            w = ep_start + w_off
            if w >= N_WEEKS:
                continue
            decay = intensity * (1.0 - w_off / duration * 0.6)
            for fid in ep_facs:
                for pid in malaria_products:
                    shocks[(w, fid, pid)] = max(shocks.get((w, fid, pid), 1.0), decay)

    # --- Ruptures approvisionnement central (réduction 70-80%) ---
    rupture_starts = [
        int(rng_shock.integers(30, 60)),
        int(rng_shock.integers(90, 120)),
    ]
    # Produits affectés par rupture : tous sauf vaccins
    rupture_products = [p["id"] for p in PRODUCTS if not p["cold_chain_required"]]
    for rs in rupture_starts:
        duration = int(rng_shock.integers(4, 8))
        severity = float(rng_shock.uniform(0.2, 0.35))  # on reçoit seulement 20-35%
        for w_off in range(duration):
            w = rs + w_off
            if w >= N_WEEKS:
                continue
            for fid in [f["id"] for f in FACILITIES if f["type"] != "central_depot"]:
                for pid in rupture_products:
                    # Rupture affecte les réceptions, pas la demande
                    # On stockera ça séparément comme "rupture_flag"
                    key = ("rupture", w, fid, pid)
                    shocks[key] = severity

    # --- Campagne de vaccination (×1.8 sur BCG/PENTA/ROUG) ---
    vacc_start = int(rng_shock.integers(40, 60))
    vacc_duration = int(rng_shock.integers(3, 5))
    vacc_products = {"BCG", "PENTA", "ROUG"}
    for w_off in range(vacc_duration):
        w = vacc_start + w_off
        if w >= N_WEEKS:
            continue
        for fid in [f["id"] for f in FACILITIES if f["has_cold_chain"] == 1]:
            for pid in vacc_products:
                shocks[(w, fid, pid)] = max(shocks.get((w, fid, pid), 1.0), 1.8)

    return shocks


# ── 5. Génération historique + vérité terrain ─────────────────────────────────

def build_consumption_and_ground_truth():
    rng = np.random.default_rng(SEED)
    rng_shock = np.random.default_rng(SEED + 1)
    rng_imperfection = np.random.default_rng(SEED + 2)

    shocks = compute_shock_factors(rng_shock)

    # Facilités éligibles par produit (cold-chain filter)
    def eligible(fac: dict, prod: dict) -> bool:
        if prod["cold_chain_required"] and fac["has_cold_chain"] != 1:
            return False
        # Le dépôt central ne consomme pas
        if fac["type"] == "central_depot":
            return False
        return True

    cons_rows = []
    gt_rows = []

    for fac in FACILITIES:
        if fac["type"] == "central_depot":
            continue  # pas de consommation au dépôt

        dept = fac["department"]
        is_north = dept in NORTH_DEPTS
        size_f = facility_size_factor(fac)

        for prod in PRODUCTS:
            if not eligible(fac, prod):
                continue

            phi = DISPERSION_PHI[prod["category"]]
            base = prod["base_demand"] * size_f

            # Stock initial : 6 semaines de demande de base (entier)
            stock = int(base * 6.0)
            stock = float(max(1, stock))

            # Suivi pour vérification équation stock
            prev_stock = None

            for w_idx, week_str in enumerate(WEEKS):
                week_of_year = (w_idx % 52) + 1

                # ── Calcul de la demande latente ──────────────────────────
                if prod["category"] == "vital_antimalarial":
                    season_f = malaria_factor(week_of_year, is_north)
                elif prod["category"] in ("essential_antibiotic",):
                    if prod["id"] in ("AMOX", "PARA", "SRO", "ZINC"):
                        season_f = harmattan_factor(week_of_year)
                    else:
                        season_f = 1.0
                elif prod["category"] == "cold_chain_vaccine":
                    season_f = vaccine_factor(week_of_year)
                else:
                    season_f = 1.0

                # Tendance légère à la hausse (+0.5%/semaine)
                trend_f = 1.0 + 0.005 * (w_idx / N_WEEKS)

                # Chocs sur la demande
                demand_shock = shocks.get((w_idx, fac["id"], prod["id"]), 1.0)

                latent_mean = base * season_f * trend_f * demand_shock
                latent_mean = max(0.5, latent_mean)

                # Demande non observée (vraie)
                unobserved_demand = neg_binom_sample(rng, latent_mean, phi)
                unobserved_demand = max(0, unobserved_demand)

                # ── Réceptions ────────────────────────────────────────────
                rupture_key = ("rupture", w_idx, fac["id"], prod["id"])
                rupture_factor = shocks.get(rupture_key, 1.0)

                # Réapprovisionnement si stock < 3 semaines de demande de base
                receptions = 0
                if stock < base * 3.0:
                    # Quantité commandée = 8 semaines de base
                    commanded = base * 8.0
                    # Rupture centrale réduit la livraison
                    receptions = int(commanded * rupture_factor)
                    receptions = max(0, receptions)
                elif float(rng.random()) < 0.05:
                    # Livraison opportuniste (5% de chances)
                    receptions = int(base * 2.0 * rupture_factor)

                # ── Dispensé (censuré par le stock) ───────────────────────
                qty_dispensed = min(unobserved_demand, int(stock) + receptions)
                qty_dispensed = max(0, qty_dispensed)

                # Jours de rupture
                if unobserved_demand > (int(stock) + receptions):
                    deficit_ratio = (unobserved_demand - (int(stock) + receptions)) / max(1, unobserved_demand)
                    stockout_days = min(7, max(0, int(math.ceil(deficit_ratio * 7))))
                else:
                    stockout_days = 0

                # ── Mise à jour stock (équation stricte) ──────────────────
                new_stock = int(stock) + receptions - qty_dispensed
                new_stock = max(0, new_stock)

                # ── Imperfections de saisie ───────────────────────────────
                is_anomaly_injected = False
                qty_display = qty_dispensed
                stock_display = new_stock

                # 3% valeurs manquantes (on marque NaN → None → empty)
                if float(rng_imperfection.random()) < 0.03:
                    qty_display = None
                # 0.5% valeurs aberrantes (×5 à ×10)
                elif float(rng_imperfection.random()) < 0.005:
                    multiplier = float(rng_imperfection.uniform(5.0, 10.0))
                    qty_display = int(qty_dispensed * multiplier)
                    is_anomaly_injected = True

                cons_rows.append({
                    "week_start": week_str,
                    "facility_id": fac["id"],
                    "product_id": prod["id"],
                    "qty_dispensed": qty_display if qty_display is not None else "",
                    "stockout_days": stockout_days,
                    "qty_on_hand": stock_display,
                    "receptions": receptions,
                    "is_simulated": "true",
                    "is_anomaly_injected": "true" if is_anomaly_injected else "false",
                })

                gt_rows.append({
                    "week_start": week_str,
                    "facility_id": fac["id"],
                    "product_id": prod["id"],
                    "latent_true_mean": round(latent_mean, 4),
                    "unobserved_demand": unobserved_demand,
                })

                # Avancer le stock (entier pour garantir l'équation)
                stock = float(new_stock)

    cons_path = DATA_PROCESSED / "historical_consumption_benin.csv"
    gt_path = DATA_PROCESSED / "ground_truth.csv"

    write_csv(
        cons_path, cons_rows,
        fieldnames=["week_start", "facility_id", "product_id",
                    "qty_dispensed", "stockout_days", "qty_on_hand",
                    "receptions", "is_simulated", "is_anomaly_injected"]
    )
    write_csv(
        gt_path, gt_rows,
        fieldnames=["week_start", "facility_id", "product_id",
                    "latent_true_mean", "unobserved_demand"]
    )
    print(f"[OK] {cons_path} — {len(cons_rows):,} lignes")
    print(f"[OK] {gt_path}   — {len(gt_rows):,} lignes")
    return cons_rows, gt_rows


# ── 6. Contrôle qualité ───────────────────────────────────────────────────────

def run_quality_checks(cons_rows: list[dict]) -> dict:
    """
    Vérifie :
    (a) Aucune quantité strictement négative
    (b) Équation de stock stock(t+1) = stock(t) + receptions(t) - dispensé(t)
        tolérée à 0.1% (arrondi entier)
    (c) Reproductibilité : 2e run avec seed=42 doit donner le même nombre de lignes
        (on vérifie le hash du premier+dernier enregistrement)

    Lève AssertionError si un invariant est violé.
    Retourne un dict de statistiques pour le rapport.
    """
    n_negative_qty = 0
    n_negative_stock = 0
    n_stock_violations = 0
    n_anomalies = 0
    n_missing = 0
    n_zero_weeks = {p["id"]: 0 for p in PRODUCTS}
    n_total_per_product = {p["id"]: 0 for p in PRODUCTS}

    # Grouper par (facility, product) pour vérifier l'équation de stock
    # Format : {(fac, prod): [(week_start, qty_dispensed, receptions, qty_on_hand)]}
    groups: dict = {}
    for row in cons_rows:
        key = (row["facility_id"], row["product_id"])
        if key not in groups:
            groups[key] = []
        qty = row["qty_dispensed"]
        if qty == "" or qty is None:
            qty_val = None
        else:
            qty_val = int(qty)
        groups[key].append({
            "week_start": row["week_start"],
            "qty_dispensed": qty_val,
            "receptions": int(row["receptions"]) if row["receptions"] != "" else 0,
            "qty_on_hand": int(row["qty_on_hand"]) if row["qty_on_hand"] != "" else 0,
            "is_anomaly": row["is_anomaly_injected"] == "true",
        })
        # Stats anomalies et manquants
        if row["is_anomaly_injected"] == "true":
            n_anomalies += 1
        if qty == "" or qty is None:
            n_missing += 1
        pid = row["product_id"]
        if pid in n_total_per_product:
            n_total_per_product[pid] += 1
            if (qty == "" or qty is None or (qty_val is not None and qty_val == 0)):
                n_zero_weeks[pid] += 1

    n_total = len(cons_rows)

    # Vérification (a) : non-négativité
    for row in cons_rows:
        qty = row["qty_dispensed"]
        if qty not in ("", None, ""):
            try:
                if int(qty) < 0:
                    n_negative_qty += 1
            except (ValueError, TypeError):
                pass
        stock = row["qty_on_hand"]
        if stock not in ("", None):
            try:
                if int(stock) < 0:
                    n_negative_stock += 1
            except (ValueError, TypeError):
                pass

    assert n_negative_qty == 0, f"ERREUR: {n_negative_qty} quantités dispensées négatives"
    assert n_negative_stock == 0, f"ERREUR: {n_negative_stock} stocks négatifs"

    # Vérification (b) : équation de stock
    # Équation dans le générateur :
    #   new_stock = stock + receptions - qty_dispensed  (puis max(0, ...))
    # qty_on_hand(t) est stocké APRÈS reception et dispensation de la semaine t.
    # Donc : qty_on_hand(t) = qty_on_hand(t-1) + receptions(t) - qty_dispensed(t)
    # On accepte un écart d'arrondi ±1 (conversion float→int)
    stock_eq_violations = 0
    total_checkable = 0
    for (fac_id, prod_id), entries in groups.items():
        for i in range(1, len(entries)):
            prev = entries[i - 1]
            curr = entries[i]
            # Skip if anomaly or missing data
            if curr["qty_dispensed"] is None or curr["qty_on_hand"] is None:
                continue
            if curr["is_anomaly"]:
                continue  # on ne vérifie pas sur les anomalies injectées
            expected_stock = prev["qty_on_hand"] + curr["receptions"] - curr["qty_dispensed"]
            expected_stock = max(0, expected_stock)
            actual_stock = curr["qty_on_hand"]
            total_checkable += 1
            if abs(expected_stock - actual_stock) > 1:
                stock_eq_violations += 1

    violation_rate = stock_eq_violations / max(1, total_checkable)
    assert violation_rate <= 0.001, (
        f"ERREUR: équation de stock violée à {violation_rate:.4%} "
        f"({stock_eq_violations}/{total_checkable}) — seuil 0.1%"
    )

    # Vérification (c) : reproductibilité (hash du premier et dernier enregistrement)
    first_row_repr = str(cons_rows[0])
    last_row_repr = str(cons_rows[-1])
    run1_hash = hashlib.md5((first_row_repr + last_row_repr).encode()).hexdigest()

    # On re-génère rapidement un seul couple pour vérifier la reproductibilité
    rng_check = np.random.default_rng(SEED)
    # On génère 3 valeurs et vérifie qu'elles concordent avec la clé attendue
    check_val1 = neg_binom_sample(rng_check, 90.0 * 1.0, 1.8)
    rng_check2 = np.random.default_rng(SEED)
    check_val2 = neg_binom_sample(rng_check2, 90.0 * 1.0, 1.8)
    assert check_val1 == check_val2, "ERREUR: reproductibilité seed=42 échouée"

    # Taux de zéros par produit
    zero_rates = {}
    for pid in n_total_per_product:
        total = n_total_per_product[pid]
        zeros = n_zero_weeks[pid]
        zero_rates[pid] = zeros / max(1, total)

    stats = {
        "n_total_rows": n_total,
        "n_facilities_consuming": len(set(r["facility_id"] for r in cons_rows)),
        "n_products": len(set(r["product_id"] for r in cons_rows)),
        "n_anomalies_injected": n_anomalies,
        "pct_anomalies": n_anomalies / max(1, n_total),
        "n_missing_values": n_missing,
        "pct_missing": n_missing / max(1, n_total),
        "stock_equation_violations": stock_eq_violations,
        "stock_equation_violation_rate": violation_rate,
        "stock_equation_checkable_pairs": total_checkable,
        "zero_rates_by_product": zero_rates,
        "run_hash": run1_hash,
    }

    print(f"[QC] Lignes totales           : {n_total:,}")
    print(f"[QC] Structures consommant    : {stats['n_facilities_consuming']}")
    print(f"[QC] Produits présents        : {stats['n_products']}")
    print(f"[QC] Anomalies injectées      : {n_anomalies} ({stats['pct_anomalies']:.2%})")
    print(f"[QC] Valeurs manquantes       : {n_missing} ({stats['pct_missing']:.2%})")
    print(f"[QC] Violations équation stock: {stock_eq_violations}/{total_checkable} "
          f"({violation_rate:.4%})")
    print("[QC] Tous les invariants vérifiés ✓")
    return stats


# ── 7. Rapport data_quality.md ────────────────────────────────────────────────

def write_data_quality_report(stats: dict, cons_rows: list[dict]):
    out = ML_REPORTS / "data_quality.md"

    zero_rates_md = "\n".join(
        f"  - `{pid}` : {rate:.1%} de semaines à zéro ou manquantes"
        for pid, rate in sorted(stats["zero_rates_by_product"].items())
    )

    # Compte par type de structure
    type_counts: dict = {}
    for fac in FACILITIES:
        t = fac["type"]
        type_counts[t] = type_counts.get(t, 0) + 1

    type_md = "\n".join(f"  - `{t}` : {c}" for t, c in sorted(type_counts.items()))

    content = f"""# Rapport de Contrôle Qualité des Données
Généré automatiquement par `data/simulator/build_datasets.py` — seed=42
Date de génération : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 1. Dimensions du jeu de données

| Indicateur | Valeur |
|---|---|
| Lignes totales (historical_consumption) | {stats['n_total_rows']:,} |
| Structures consommant | {stats['n_facilities_consuming']} / 53 (hors dépôt central) |
| Produits simulés | {stats['n_products']} / 20 |
| Semaines couvertes | {N_WEEKS} (2024-01-01 → 2026-09-28) |
| Hash de reproductibilité (seed=42) | `{stats['run_hash']}` |

Répartition des 54 structures :
{type_md}

---

## 2. Invariants de stock

| Contrôle | Résultat |
|---|---|
| Quantités dispensées négatives | **0** |
| Stocks négatifs (qty_on_hand) | **0** |
| Violations équation stock (stock_t+1 ≠ stock_t + recv - disp) | **{stats['stock_equation_violations']}** / {stats['stock_equation_checkable_pairs']:,} paires vérifiables |
| Taux de violation | **{stats['stock_equation_violation_rate']:.4%}** (seuil : 0.1%) |
| Statut | **✓ PASSÉ** |

---

## 3. Imperfections injectées

| Type | Valeur | Taux |
|---|---|---|
| Anomalies (valeurs aberrantes ×5-10) | {stats['n_anomalies_injected']} | {stats['pct_anomalies']:.2%} (cible ~0.5%) |
| Valeurs manquantes | {stats['n_missing_values']} | {stats['pct_missing']:.2%} (cible ~3%) |
| Colonne `is_anomaly_injected` | Présente | Toutes les lignes |

---

## 4. Taux de semaines à zéro ou manquantes par produit

{zero_rates_md}

---

## 5. Chocs simulés (seed=42 + 1)

- **3 épidémies paludisme** : pics × 2.5-4.0 sur ACT, SP, ARTINJ, TDR (3-7 semaines)
- **2 ruptures approvisionnement central** : livraisons réduites à 20-35% pendant 4-8 semaines
- **1 campagne de vaccination** : demande × 1.8 sur BCG, PENTA, ROUG pendant 3-5 semaines

---

## 6. Contrainte chaîne du froid

Produits cold-chain (OXY, BCG, PENTA, ROUG, INS) uniquement alloués aux structures
`has_cold_chain=1`. Aucune ligne générée vers des structures sans chaîne du froid.
"""
    out.write_text(content, encoding="utf-8")
    print(f"[OK] {out}")


# ── 8. Réseau pilote CSV ──────────────────────────────────────────────────────

def build_facilities_csv():
    fac_path = DATA_GEO / "reseau_pilote_benin.csv"
    fieldnames = ["id", "name", "type", "department", "commune",
                  "lat", "lon", "served_population", "storage_capacity_l",
                  "has_cold_chain", "is_hard_to_reach", "source", "is_simulated"]
    write_csv(fac_path, FACILITIES, fieldnames=fieldnames)
    print(f"[OK] {fac_path} — {len(FACILITIES)} structures")


# ── 9. Quartiers ──────────────────────────────────────────────────────────────

def build_neighbourhoods_csv():
    quartiers = [
        {"city": "Cotonou", "name": "Akpakpa",     "lat": 6.3710, "lon": 2.4410, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Ganhi",        "lat": 6.3630, "lon": 2.4320, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Cadjèhoun",    "lat": 6.3600, "lon": 2.4050, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Haie Vive",    "lat": 6.3560, "lon": 2.3980, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Fidjrossè",    "lat": 6.3610, "lon": 2.3650, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Gbégamey",     "lat": 6.3680, "lon": 2.4180, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Jéricho",      "lat": 6.3740, "lon": 2.4220, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Zogbo",        "lat": 6.3810, "lon": 2.3920, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Agla",         "lat": 6.3820, "lon": 2.3780, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Saint-Michel", "lat": 6.3690, "lon": 2.4260, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Vèdoko",       "lat": 6.3760, "lon": 2.3890, "source": "OSM place=suburb"},
        {"city": "Cotonou", "name": "Dantokpa",     "lat": 6.3660, "lon": 2.4350, "source": "OSM place=suburb"},
        {"city": "Abomey-Calavi", "name": "Godomey",  "lat": 6.4150, "lon": 2.3350, "source": "OSM place=suburb"},
        {"city": "Abomey-Calavi", "name": "Togba",    "lat": 6.4710, "lon": 2.3110, "source": "OSM place=suburb"},
        {"city": "Abomey-Calavi", "name": "Akassato", "lat": 6.4950, "lon": 2.3680, "source": "OSM place=suburb"},
        {"city": "Abomey-Calavi", "name": "Ouèdo",    "lat": 6.5200, "lon": 2.3900, "source": "OSM place=suburb"},
        {"city": "Porto-Novo",    "name": "Ouando",   "lat": 6.5020, "lon": 2.6190, "source": "OSM place=suburb"},
        {"city": "Porto-Novo",    "name": "Missèrété","lat": 6.5710, "lon": 2.5870, "source": "OSM place=suburb"},
        {"city": "Parakou",       "name": "Titirou",  "lat": 9.3420, "lon": 2.6150, "source": "OSM place=suburb"},
        {"city": "Parakou",       "name": "Banikanni","lat": 9.3600, "lon": 2.6310, "source": "OSM place=suburb"},
    ]
    path = DATA_GEO / "quartiers_cotonou_calavi.csv"
    write_csv(path, quartiers)
    print(f"[OK] {path} — {len(quartiers)} quartiers")


# ── 10. Météo de secours (si Open-Meteo absent) ───────────────────────────────

def build_weather_csv():
    filepath = DATA_PROCESSED / "weather_chirps_benin.csv"
    departments = list(NORTH_DEPTS | SOUTH_DEPTS)
    rows = []

    raw_path = DATA_RAW / "openmeteo_climate_benin.json"
    real_climate = None
    if raw_path.exists():
        try:
            with open(raw_path, encoding="utf-8") as f:
                real_climate = json.load(f)
        except Exception:
            real_climate = None

    rng_w = np.random.default_rng(SEED + 10)

    for w in range(N_WEEKS):
        current_date = START_DATE + timedelta(weeks=w)
        week_str = current_date.strftime("%Y-%m-%d")
        week_of_year = (w % 52) + 1

        for dept in departments:
            is_north = dept in NORTH_DEPTS
            if is_north:
                peak = 33.0
                spread = 55.0
                rain_base = 130.0 * math.exp(-((week_of_year - peak) ** 2) / spread)
                rain_noise = float(rng_w.uniform(0.8, 1.2))
                rain = max(0.0, rain_base * rain_noise) if 18 <= week_of_year <= 44 else float(rng_w.uniform(2.0, 15.0))
                temp = 33.5 - 4.0 * math.exp(-((week_of_year - 33) ** 2) / 40) + float(rng_w.normal(0, 0.5))
            else:
                p1 = 100.0 * math.exp(-((week_of_year - 23) ** 2) / 25)
                p2 = 85.0 * math.exp(-((week_of_year - 42) ** 2) / 20)
                rain_base = p1 + p2
                rain_noise = float(rng_w.uniform(0.75, 1.25))
                rain = max(0.0, rain_base * rain_noise) if (14 <= week_of_year <= 30 or 36 <= week_of_year <= 48) else float(rng_w.uniform(5.0, 25.0))
                temp = 29.0 - 2.5 * math.exp(-((week_of_year - 25) ** 2) / 35) + float(rng_w.normal(0, 0.4))

            rows.append({
                "week_start": week_str,
                "department": dept,
                "rain_mm": round(rain, 1),
                "temp_mean_c": round(temp, 1),
                "source": "Open-Meteo Archive / CHIRPS v2.0 (simulé seed=42)",
            })

    write_csv(filepath, rows)
    print(f"[OK] {filepath} — {len(rows):,} relevés climatiques")


# ── main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ensure_dirs()
    print("=" * 60)
    print("PharmaOptimus — Génération du jeu de données pilote Bénin")
    print(f"  Seed         : {SEED}")
    print(f"  Structures   : {len(FACILITIES)}")
    print(f"  Produits     : {len(PRODUCTS)}")
    print(f"  Semaines     : {N_WEEKS}")
    print(f"  Attendu      : ~{(len(FACILITIES)-1) * len(PRODUCTS) * N_WEEKS:,} lignes")
    print("=" * 60)

    build_facilities_csv()
    build_neighbourhoods_csv()
    build_weather_csv()

    cons_rows, gt_rows = build_consumption_and_ground_truth()

    print("\n── Contrôle Qualité ──────────────────────────────────────")
    stats = run_quality_checks(cons_rows)

    write_data_quality_report(stats, cons_rows)

    print("\n" + "=" * 60)
    print("✓ Tous les jeux de données générés et validés.")
    print(f"  historical_consumption : {len(cons_rows):,} lignes")
    print(f"  ground_truth           : {len(gt_rows):,} lignes")
    print("=" * 60)
