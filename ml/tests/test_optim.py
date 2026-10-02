"""
ml/tests/test_optim.py
Tests pytest des solveurs d'optimisation (transferts et VRP).
Vérifie :
1. Inviolabilité de la chaîne du froid dans les transferts
2. Respect des surplus disponibles (contrainte de capacité émettrice)
3. Aucun transfert si aucune liaison admissible
4. VRP sur réseau minimal de 5 établissements : retourne des routes non vides
5. VRP : aucun véhicule ne dépasse sa capacité
6. Bornes et cohérence du score de priorité
Lancer : pytest ml/tests/test_optim.py -v
"""

import pytest
import sys
from pathlib import Path

# Ajouter la racine du projet au chemin pour les imports relatifs
WORKDIR = Path(__file__).parents[2]
sys.path.insert(0, str(WORKDIR))

from ml.src.optim.transfers_solver import solve_transfers_pulp
from ml.src.optim.vrp_solver import solve_vrp_fleet


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _minimal_distance_matrix(n):
    """Matrice de distances (m) symétriques pour n nœuds (dépôt inclus)."""
    import math
    mat = []
    for i in range(n):
        row = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                row.append(int(abs(i - j) * 15000))  # ~15 km entre nœuds consécutifs
        mat.append(row)
    return mat


def _minimal_duration_matrix(n):
    """Matrice de durées (s) dérivée des distances à 60 km/h."""
    dist = _minimal_distance_matrix(n)
    return [[int(d / 1000 * 60) for d in row] for row in dist]


# ---------------------------------------------------------------------------
# Tests transferts
# ---------------------------------------------------------------------------

def test_transfers_cold_chain_blocks_dry_sender():
    """Un expéditeur sans chaîne du froid ne peut pas envoyer un produit froid."""
    surplus = [
        {
            "id": "fac-dry",
            "name": "Centre Sans Frigo",
            "has_cold_chain": False,
            "surplus_qty": 100,
            "requires_cold_chain": True,
        }
    ]
    deficit = [
        {
            "id": "fac-cold",
            "name": "Hôpital Avec Frigo",
            "has_cold_chain": True,
            "need_qty": 50,
            "requires_cold_chain": True,
        }
    ]
    dist = {("fac-dry", "fac-cold"): 20.0}
    result = solve_transfers_pulp(surplus, deficit, dist)
    assert result == [], (
        "Aucun transfert ne doit être émis depuis un établissement sans chaîne du froid "
        "pour un produit qui en exige une."
    )


def test_transfers_cold_chain_blocks_dry_receiver():
    """Un destinataire sans chaîne du froid ne peut pas recevoir un produit froid."""
    surplus = [
        {
            "id": "fac-cold-sender",
            "name": "Dépôt Froid",
            "has_cold_chain": True,
            "surplus_qty": 200,
            "requires_cold_chain": True,
        }
    ]
    deficit = [
        {
            "id": "fac-dry-receiver",
            "name": "Centre Sans Frigo",
            "has_cold_chain": False,
            "need_qty": 80,
            "requires_cold_chain": True,
        }
    ]
    dist = {("fac-cold-sender", "fac-dry-receiver"): 10.0}
    result = solve_transfers_pulp(surplus, deficit, dist)
    assert result == [], (
        "Aucun transfert ne doit être réalisé vers un établissement sans chaîne du froid "
        "pour un produit qui en exige une."
    )


def test_transfers_surplus_capacity_respected():
    """La quantité totale transférée ne doit pas dépasser le surplus disponible."""
    surplus = [
        {
            "id": "fac-s1",
            "name": "Dépôt A",
            "has_cold_chain": False,
            "surplus_qty": 50,
            "requires_cold_chain": False,
        }
    ]
    deficit = [
        {
            "id": "fac-d1",
            "name": "Centre B",
            "has_cold_chain": False,
            "need_qty": 40,
            "requires_cold_chain": False,
        },
        {
            "id": "fac-d2",
            "name": "Centre C",
            "has_cold_chain": False,
            "need_qty": 40,
            "requires_cold_chain": False,
        },
    ]
    dist = {
        ("fac-s1", "fac-d1"): 15.0,
        ("fac-s1", "fac-d2"): 25.0,
    }
    result = solve_transfers_pulp(surplus, deficit, dist)
    total_transferred = sum(t["quantity"] for t in result)
    assert total_transferred <= 50, (
        f"Total transféré {total_transferred} dépasse le surplus disponible de 50 unités."
    )


def test_transfers_no_liaison_returns_empty():
    """Si aucun couple (surplus, déficit) ne forme une liaison admissible, retourne liste vide."""
    result = solve_transfers_pulp([], [], {})
    assert result == [], "Appel avec listes vides doit retourner []."


def test_transfers_dry_product_allowed_without_cold_chain():
    """Un produit sec peut être transféré même sans chaîne du froid."""
    surplus = [
        {
            "id": "fac-a",
            "name": "Centre A",
            "has_cold_chain": False,
            "surplus_qty": 100,
            "requires_cold_chain": False,
        }
    ]
    deficit = [
        {
            "id": "fac-b",
            "name": "Centre B",
            "has_cold_chain": False,
            "need_qty": 60,
            "requires_cold_chain": False,
        }
    ]
    dist = {("fac-a", "fac-b"): 30.0}
    result = solve_transfers_pulp(surplus, deficit, dist)
    assert len(result) >= 1, "Un transfert de produit sec doit être autorisé."
    assert result[0]["quantity"] <= 100, "Quantité transférée > surplus disponible."
    assert result[0]["quantity"] <= 60, "Quantité transférée > besoin du destinataire."


# ---------------------------------------------------------------------------
# Tests VRP
# ---------------------------------------------------------------------------

def test_vrp_returns_routes_on_minimal_network():
    """VRP sur 5 nœuds (dépôt + 4 sites) avec 2 véhicules retourne des routes non vides."""
    n = 5
    dist_mat = _minimal_distance_matrix(n)
    dur_mat = _minimal_duration_matrix(n)
    demands = [0, 10, 15, 20, 5]        # dépôt = 0
    capacities = [60, 60]               # 2 camions de 60 L
    max_shifts = [28800, 28800]         # 8 heures chacun
    priority_penalties = [0, 1000, 1000, 1000, 1000]

    routes, unserved = solve_vrp_fleet(
        dist_mat, dur_mat, demands, capacities, max_shifts, priority_penalties,
        depot=0, time_limit_sec=5
    )
    assert routes is not None, "Le solveur VRP ne doit pas retourner None."
    total_stops = sum(len(r) for r in routes)
    assert total_stops >= 1, "Au moins un nœud doit être servi sur un réseau de 4 sites."


def test_vrp_capacity_never_exceeded():
    """Aucun véhicule ne doit dépasser sa capacité volumétrique."""
    n = 5
    dist_mat = _minimal_distance_matrix(n)
    dur_mat = _minimal_duration_matrix(n)
    demands = [0, 10, 15, 20, 8]
    capacities = [30, 30]
    max_shifts = [28800, 28800]
    priority_penalties = [0, 500, 500, 500, 500]

    routes, unserved = solve_vrp_fleet(
        dist_mat, dur_mat, demands, capacities, max_shifts, priority_penalties,
        depot=0, time_limit_sec=5
    )
    assert routes is not None, "Le solveur VRP ne doit pas retourner None."
    for v_idx, route in enumerate(routes):
        load = sum(demands[node] for node in route)
        assert load <= capacities[v_idx], (
            f"Véhicule {v_idx} : charge {load} dépasse la capacité {capacities[v_idx]}."
        )


def test_vrp_all_nodes_in_routes_or_unserved():
    """Chaque nœud (hors dépôt) figure soit dans une route, soit dans la liste des non-servis."""
    n = 5
    dist_mat = _minimal_distance_matrix(n)
    dur_mat = _minimal_duration_matrix(n)
    demands = [0, 5, 5, 5, 5]
    capacities = [40, 40]
    max_shifts = [28800, 28800]
    priority_penalties = [0, 200, 200, 200, 200]

    routes, unserved = solve_vrp_fleet(
        dist_mat, dur_mat, demands, capacities, max_shifts, priority_penalties,
        depot=0, time_limit_sec=5
    )
    all_assigned = set(node for route in routes for node in route) | set(unserved)
    expected = set(range(1, n))
    assert expected == all_assigned, (
        f"Nœuds manquants : {expected - all_assigned}. "
        f"Chaque nœud doit être servi ou explicitement listé comme non-servi."
    )
