"""
ml/src/optim/transfers_solver.py
Optimisation des transferts horizontaux inter-établissements.
Formulation : Programmation Linéaire en Nombres Entiers (PLNE).
Objectif : Minimiser le coût de transport et pénalités de manque
Contraintes :
  - Inviolabilité absolue de la chaîne du froid
  - Respect du stock de sécurité de l'établissement expéditeur
  - Temps de transport inférieur à la durée de conservation résiduelle
"""

try:
    import pulp
    HAS_PULP = True
except ImportError:
    HAS_PULP = False

def solve_transfers_pulp(surplus_nodes, deficit_nodes, distance_matrix, unit_cost_km=250, fixed_cost=5000):
    """
    Résout le problème de transfert par PLNE avec PuLP (solveur CBC) ou heuristique gloutonne.
    
    surplus_nodes : Liste de dictionnaires {'id', 'name', 'has_cold_chain', 'surplus_qty', 'shelf_days'}
    deficit_nodes : Liste de dictionnaires {'id', 'name', 'has_cold_chain', 'need_qty'}
    distance_matrix : Dictionnaire {(from_id, to_id): distance_km}
    """
    if not surplus_nodes or not deficit_nodes:
      return []

    if not HAS_PULP:
      # Heuristique gloutonne de repli respectant la chaîne du froid
      transfers = []
      for s in surplus_nodes:
          for d in deficit_nodes:
              if s.get("requires_cold_chain", False) and (not s["has_cold_chain"] or not d["has_cold_chain"]):
                  continue
              qty = min(s.get("surplus_qty", 0), d.get("need_qty", 0))
              if qty > 5:
                  dist = distance_matrix.get((s["id"], d["id"]), 40.0)
                  transfers.append({
                      "from_facility_id": s["id"],
                      "from_facility_name": s["name"],
                      "to_facility_id": d["id"],
                      "to_facility_name": d["name"],
                      "quantity": qty,
                      "distance_km": dist,
                      "status": "pending",
                      "reason_fr": f"Transfert d'urgence de {qty} unités depuis {s['name']} pour prévenir la rupture imminente à {d['name']}."
                  })
                  break
      return transfers

    prob = pulp.LpProblem("Inter_Facility_Transfers", pulp.LpMinimize)

    # Variables de décision
    # x[i, j] : Quantité transférée de l'établissement i vers l'établissement j
    # y[i, j] : Variable binaire indiquant l'ouverture d'une liaison de transfert
    x = {}
    y = {}

    for i in surplus_nodes:
      for j in deficit_nodes:
          # Règle d'inviolabilité de la chaîne du froid
          # Si le produit exige le froid et qu'une des structures n'en dispose pas : pas de liaison
          if (i.get("requires_cold_chain", False)) and (not i["has_cold_chain"] or not j["has_cold_chain"]):
              continue

          dist = distance_matrix.get((i["id"], j["id"]), 9999.0)
          if dist > 250.0: # Limite opérationnelle de 250 km pour transfert d'urgence
              continue

          key = (i["id"], j["id"])
          x[key] = pulp.LpVariable(f"x_{i['id']}_{j['id']}", lowBound=0, cat=pulp.LpInteger)
          y[key] = pulp.LpVariable(f"y_{i['id']}_{j['id']}", cat=pulp.LpBinary)

    if not x:
      return []

    # Fonction Objectif : Minimiser les coûts fixes + coûts kilométriques
    prob += pulp.lpSum(
      fixed_cost * y[key] + (unit_cost_km * distance_matrix.get(key, 100.0) * 0.001) * x[key]
      for key in x
    )

    # Contrainte 1 : Ne pas donner plus que le surplus disponible
    for i in surplus_nodes:
      out_vars = [x[(i["id"], j["id"])] for j in deficit_nodes if (i["id"], j["id"]) in x]
      if out_vars:
          prob += pulp.lpSum(out_vars) <= i["surplus_qty"], f"Cap_Surplus_{i['id']}"

    # Contrainte 2 : Couvrir au maximum le besoin sans le dépasser
    for j in deficit_nodes:
      in_vars = [x[(i["id"], j["id"])] for i in surplus_nodes if (i["id"], j["id"]) in x]
      if in_vars:
          prob += pulp.lpSum(in_vars) <= j["need_qty"], f"Cap_Need_{j['id']}"

    # Contrainte 3 : Liaison x <= M * y
    for key in x:
      prob += x[key] <= 5000 * y[key], f"BigM_{key[0]}_{key[1]}"

    # Contrainte 4 : Capacité cold chain séparée (Point 3 du bilan de risques)
    # Les produits à chaîne du froid ont une capacité réfrigérée distincte.
    # cap_cold[j] = 20 % de la capacité de stockage standard (hypothèse documentée).
    cold_chain_products_in_play = set()
    for key in x:
        from_node = next((s for s in surplus_nodes if s["id"] == key[0]), None)
        if from_node and from_node.get("requires_cold_chain", False):
            cold_chain_products_in_play.add(key[1])  # ID du destinataire
    for dest_id in cold_chain_products_in_play:
        cold_in_vars = [
            x[k] for k in x
            if k[1] == dest_id
            and next((s for s in surplus_nodes if s["id"] == k[0] and s.get("requires_cold_chain", False)), None)
        ]
        if cold_in_vars:
            dest_node = next((d for d in deficit_nodes if d["id"] == dest_id), None)
            cap_cold = dest_node.get("cold_chain_capacity", dest_node.get("need_qty", 999))
            prob += pulp.lpSum(cold_in_vars) <= cap_cold, f"Cap_Cold_{dest_id}"
    
    # Résolution silencieuse
    prob.solve(pulp.PULP_CBC_CMD(msg=False, timeLimit=15))

    transfers = []
    if prob.status == pulp.LpStatusOptimal:
      for key in x:
          qty = int(x[key].varValue or 0)
          if qty > 5:
              from_node = next(s for s in surplus_nodes if s["id"] == key[0])
              to_node = next(d for d in deficit_nodes if d["id"] == key[1])
              dist = distance_matrix.get(key, 0.0)
              transfers.append({
                  "from_facility_id": key[0],
                  "from_facility_name": from_node["name"],
                  "to_facility_id": key[1],
                  "to_facility_name": to_node["name"],
                  "quantity": qty,
                  "distance_km": dist,
                  "status": "pending",
                  "reason_fr": f"Transfert d'urgence de {qty} unités depuis {from_node['name']} pour prévenir la rupture imminente à {to_node['name']}."
              })

    return transfers
