#!/usr/bin/env python3
import os, sys, csv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

url = os.environ.get("SUPABASE_URL","")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY","")
if not url or not key:
    print("ERREUR : variables SUPABASE manquantes"); sys.exit(1)

from supabase import create_client
client = create_client(url, key)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
csv_path = os.path.join(ROOT, "data", "processed", "historical_consumption_benin.csv")
print(f"Chargement {csv_path}...")

rows = []
batch_size = 500
total = 0

with open(csv_path, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append({
            "week_start":    row["week_start"],
            "facility_id":   row["facility_id"],
            "product_id":    row["product_id"],
            "qty_dispensed": int(float(row.get("qty_dispensed") or 0)),
            "qty_on_hand":   int(float(row.get("qty_on_hand") or 0)),
            "stockout_days": int(float(row.get("stockout_days") or 0)),
            "is_simulated":  True,
        })
        if len(rows) >= batch_size:
            client.table("consumption_weekly").upsert(rows).execute()
            total += len(rows)
            print(f"  {total:,} lignes...")
            rows = []

if rows:
    client.table("consumption_weekly").upsert(rows).execute()
    total += len(rows)

print(f"[OK] {total:,} lignes chargees dans consumption_weekly.")
