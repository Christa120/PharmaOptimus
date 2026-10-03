"""
ml/src/optim/transfers_solver.py
Optimisation des transferts horizontaux via heuristique gloutonne.
PuLP avec solveur binaire est bypasse car non disponible sur cette plateforme.
La logique metier (cold chain, surplus, deficit) est entierement respectee.
"""


def solve_transfers_pulp(surplus_nodes, deficit_nodes, distance_matrix, unit_cost_km=250, fixed_cost=5000):
    """
    Resout le probleme de transfert par heuristique gloutonne triee par distance.
    Respecte la contrainte de chaine du froid et les surplus disponibles.
    """
    if not surplus_nodes or not deficit_nodes:
        return []

    # Trier les paires (surplus, deficit) par distance croissante
    pairs = []
    for s in surplus_nodes:
        for d in deficit_nodes:
            # Contrainte chaine du froid
            if s.get("requires_cold_chain", False) and (
                not s.get("has_cold_chain", False) or not d.get("has_cold_chain", False)
            ):
                continue
            dist = distance_matrix.get((s["id"], d["id"]), 9999.0)
            if dist > 250.0:
                continue
            pairs.append((dist, s, d))

    pairs.sort(key=lambda t: t[0])

    # Copier les surplus et deficits pour les consommer
    surplus_remaining = {s["id"]: s.get("surplus_qty", 0) for s in surplus_nodes}
    deficit_remaining = {d["id"]: d.get("need_qty", 0) for d in deficit_nodes}

    transfers = []
    for dist, s, d in pairs:
        avail = surplus_remaining.get(s["id"], 0)
        need  = deficit_remaining.get(d["id"], 0)
        if avail <= 5 or need <= 5:
            continue
        qty = min(avail, need)
        surplus_remaining[s["id"]] -= qty
        deficit_remaining[d["id"]] -= qty
        transfers.append({
            "from_facility_id":   s["id"],
            "from_facility_name": s.get("name", s["id"]),
            "to_facility_id":     d["id"],
            "to_facility_name":   d.get("name", d["id"]),
            "quantity":           int(qty),
            "distance_km":        dist,
            "status":             "pending",
            "reason_fr": (
                f"Transfert de {int(qty)} unites depuis {s.get('name', s['id'])} "
                f"vers {d.get('name', d['id'])} (distance {dist:.0f} km)."
            ),
        })

    return transfers
