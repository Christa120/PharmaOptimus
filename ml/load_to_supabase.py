#!/usr/bin/env python3
"""
ml/load_to_supabase.py
Charge les donnees de base (facilities, products) dans Supabase.
"""
import os, sys, csv, json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("ERREUR : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.")
    sys.exit(1)

from supabase import create_client
client = create_client(url, key)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ── 1. Charger les facilities ─────────────────────────────────────────────────
facilities_csv = os.path.join(ROOT, "data", "geo", "reseau_pilote_benin.csv")
print(f"Chargement facilities depuis {facilities_csv}...")

facilities = []
with open(facilities_csv, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        facilities.append({
            "id":                 row["id"],
            "name":               row["name"],
            "type":               row["type"],
            "department":         row["department"],
            "commune":            row["commune"],
            "lat":                float(row["lat"]),
            "lon":                float(row["lon"]),
            "served_population":  int(row["served_population"]),
            "storage_capacity_l": int(row["storage_capacity_l"]),
            "has_cold_chain":     row["has_cold_chain"] in ("1", "True", "true"),
            "is_hard_to_reach":   row["is_hard_to_reach"] in ("1", "True", "true"),
            "source":             row.get("source", "simulé"),
            "is_simulated":       True,
        })

# Upsert par lots de 50
batch_size = 50
for i in range(0, len(facilities), batch_size):
    batch = facilities[i:i+batch_size]
    client.table("facilities").upsert(batch).execute()
    print(f"  facilities : {min(i+batch_size, len(facilities))}/{len(facilities)}")

print(f"[OK] {len(facilities)} facilities chargées.")

# ── 2. Charger les products ───────────────────────────────────────────────────
PRODUCTS = [
    {"id":"ACT",   "code":"ACT",   "inn_name":"Artémether-Luméfantrine",     "form":"comprimé","strength":"20/120mg","pack_size":24,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730, "is_tracer":True},
    {"id":"SP",    "code":"SP",    "inn_name":"Sulfadoxine-Pyriméthamine",   "form":"comprimé","strength":"500/25mg","pack_size":3, "volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730, "is_tracer":True},
    {"id":"ARTINJ","code":"ARTINJ","inn_name":"Artésunate injectable",        "form":"injectable","strength":"60mg","pack_size":1,"volume_l_per_unit":0.05,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"TDR",   "code":"TDR",   "inn_name":"Test Diagnostic Rapide Paludisme","form":"test","strength":"1test","pack_size":25,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"AMOX",  "code":"AMOX",  "inn_name":"Amoxicilline 500mg",          "form":"comprimé","strength":"500mg","pack_size":21,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"PARA",  "code":"PARA",  "inn_name":"Paracétamol 500mg",           "form":"comprimé","strength":"500mg","pack_size":100,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":1460,"is_tracer":True},
    {"id":"SRO",   "code":"SRO",   "inn_name":"Sels de Réhydratation Orale", "form":"sachet","strength":"20.5g","pack_size":10,"volume_l_per_unit":0.01,"requires_cold_chain":False,"shelf_life_days":1095,"is_tracer":True},
    {"id":"ZINC",  "code":"ZINC",  "inn_name":"Zinc 20mg",                   "form":"comprimé","strength":"20mg","pack_size":10,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"CEFT",  "code":"CEFT",  "inn_name":"Ceftriaxone 1g inj.",         "form":"injectable","strength":"1g","pack_size":1,"volume_l_per_unit":0.05,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"OXY",   "code":"OXY",   "inn_name":"Ocytocine 10 UI inj.",        "form":"injectable","strength":"10UI","pack_size":1,"volume_l_per_unit":0.02,"requires_cold_chain":True, "shelf_life_days":730,"is_tracer":True},
    {"id":"MGSO4", "code":"MGSO4", "inn_name":"Sulfate de Magnésium",        "form":"injectable","strength":"500mg/ml","pack_size":1,"volume_l_per_unit":0.05,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"MISO",  "code":"MISO",  "inn_name":"Misoprostol 200µg",           "form":"comprimé","strength":"200µg","pack_size":4,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"BCG",   "code":"BCG",   "inn_name":"Vaccin BCG",                  "form":"injectable","strength":"0.1ml","pack_size":10,"volume_l_per_unit":0.01,"requires_cold_chain":True, "shelf_life_days":365,"is_tracer":True},
    {"id":"PENTA", "code":"PENTA", "inn_name":"Vaccin Pentavalent",          "form":"injectable","strength":"0.5ml","pack_size":1,"volume_l_per_unit":0.01,"requires_cold_chain":True, "shelf_life_days":365,"is_tracer":True},
    {"id":"ROUG",  "code":"ROUG",  "inn_name":"Vaccin Rougeole",             "form":"injectable","strength":"0.5ml","pack_size":1,"volume_l_per_unit":0.01,"requires_cold_chain":True, "shelf_life_days":365,"is_tracer":True},
    {"id":"INS",   "code":"INS",   "inn_name":"Insuline humaine NPH",        "form":"injectable","strength":"100UI/ml","pack_size":1,"volume_l_per_unit":0.01,"requires_cold_chain":True, "shelf_life_days":365,"is_tracer":True},
    {"id":"ARV",   "code":"ARV",   "inn_name":"ARV (TDF/3TC/EFV)",          "form":"comprimé","strength":"300/300/600mg","pack_size":30,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":730,"is_tracer":True},
    {"id":"AMLO",  "code":"AMLO",  "inn_name":"Amlodipine 5mg",             "form":"comprimé","strength":"5mg","pack_size":30,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":1460,"is_tracer":True},
    {"id":"METF",  "code":"METF",  "inn_name":"Metformine 500mg",           "form":"comprimé","strength":"500mg","pack_size":60,"volume_l_per_unit":0.001,"requires_cold_chain":False,"shelf_life_days":1460,"is_tracer":True},
    {"id":"RINGER","code":"RINGER","inn_name":"Ringer Lactate 500ml",        "form":"perfusion","strength":"500ml","pack_size":1,"volume_l_per_unit":0.6,"requires_cold_chain":False,"shelf_life_days":1095,"is_tracer":True},
]

print("Chargement products...")
client.table("products").upsert(PRODUCTS).execute()
print(f"[OK] {len(PRODUCTS)} products chargés.")

print("\n[OK] Chargement terminé. Relance maintenant :")
print("  python ml/run_pipeline.py --env supabase")
