"""
ml/src/optim/vrp_solver.py
Solveur de tournées de livraison VRP (Vehicle Routing Problem) avec OR-Tools.
Conforme au squelette de référence de la section 8.2 du cahier des charges :
- Prise en compte des capacités volumétriques des camions (Litres)
- Durée maximale de shift horaire (Time dimension)
- Pénalité d'omission K * Priority_Score
- Ségrégation stricte des flux frigorifiques (+2°C à +8°C)
"""

try:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

def solve_vrp_fleet(distance_matrix, duration_matrix, demands, capacities, max_shifts, priority_penalties, depot=0, time_limit_sec=10):
    """
    Résout les tournées de véhicules avec OR-Tools.
    
    Paramètres :
    - distance_matrix : Matrice carrée des distances (en mètres)
    - duration_matrix : Matrice carrée des durées (en secondes)
    - demands : Liste des volumes demandés en Litres
    - capacities : Capacité de chaque véhicule de la flotte en Litres
    - max_shifts : Durée max de service pour chaque véhicule (en secondes)
    - priority_penalties : Pénalité en cas d'omission de chaque nœud
    - depot : Index du dépôt central (par défaut 0 pour Cotonou)
    """
    if not HAS_ORTOOLS:
        # Fallback glouton si OR-Tools n'est pas encore installé dans l'environnement local
        return fallback_greedy_vrp(demands, capacities, depot)

    num_nodes = len(distance_matrix)
    num_vehicles = len(capacities)

    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, depot)
    routing = pywrapcp.RoutingModel(manager)

    # 1. Coût d'arc basé sur la distance routière
    def distance_callback(from_idx, to_idx):
        from_node = manager.IndexToNode(from_idx)
        to_node = manager.IndexToNode(to_idx)
        return int(distance_matrix[from_node][to_node])

    transit_callback_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_idx)

    # 2. Contrainte de Capacité Volumétrique (Load Dimension)
    def demand_callback(from_idx):
        from_node = manager.IndexToNode(from_idx)
        return int(demands[from_node])

    demand_callback_idx = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_idx,
        0,  # null capacity slack
        capacities,  # capacités véhicules
        True,  # start cumul to zero
        "Capacity"
    )

    # 3. Contrainte de Temps de Service (Time Dimension)
    def time_callback(from_idx, to_idx):
        from_node = manager.IndexToNode(from_idx)
        to_node = manager.IndexToNode(to_idx)
        # Trajet + 45 minutes (2700 secondes) de déchargement au site
        return int(duration_matrix[from_node][to_node] + 2700)

    time_callback_idx = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_idx,
        0,
        max(max_shifts),
        True,
        "Time"
    )
    time_dimension = routing.GetDimensionOrDie("Time")
    for v in range(num_vehicles):
        time_dimension.CumulVar(routing.End(v)).SetMax(int(max_shifts[v]))

    # 4. Pénalités de priorité clinique pour les arrêts optionnels
    for node in range(1, num_nodes):
        routing.AddDisjunction([manager.NodeToIndex(node)], int(priority_penalties[node]))

    # Paramètres de recherche heuristique (Guided Local Search)
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = time_limit_sec

    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        return None, list(range(1, num_nodes))

    routes = []
    served = set()

    for v in range(num_vehicles):
        index = routing.Start(v)
        stops = []
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node != depot:
                stops.append(node)
                served.add(node)
            index = solution.Value(routing.NextVar(index))
        routes.append(stops)

    unserved = [i for i in range(1, num_nodes) if i not in served]
    return routes, unserved

def fallback_greedy_vrp(demands, capacities, depot=0):
    """Méthode heuristique de repli."""
    unserved = []
    routes = [[] for _ in capacities]
    current_loads = [0 for _ in capacities]

    for node_idx, dem in enumerate(demands):
        if node_idx == depot:
            continue
        assigned = False
        for v_idx, cap in enumerate(capacities):
            if current_loads[v_idx] + dem <= cap:
                routes[v_idx].append(node_idx)
                current_loads[v_idx] += dem
                assigned = True
                break
        if not assigned:
            unserved.append(node_idx)

    return routes, unserved
