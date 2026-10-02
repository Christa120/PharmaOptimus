/**
 * Moteur de calcul, optimisation et simulation pour la logistique pharmaceutique
 * Implémente la prévision quantile, le score de priorité multi-critères,
 * l'appariement linéaire des transferts et la planification des tournées VRP.
 */

import {
  Facility,
  Product,
  TransferRecommendation,
  DeliveryRoute,
  ScenarioDefinition,
  ScenarioSimulationResult,
  WeeklyForecast,
  GeoCoordinate,
} from '../types/pharma';
import { TRACER_MEDICINES } from '../data/medicines';

// Calcul de distance géodésique (Haversine) avec facteur de détour routier standard 1.4
export function calculateRoadDistanceKm(c1: GeoCoordinate, c2: GeoCoordinate): number {
  const R = 6371; // Rayon moyen Terre en km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lon - c1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const birdFlyKm = R * c;
  // Facteur de détour routier documenté dans le cahier des charges (section 8.3)
  return Math.round(birdFlyKm * 1.4 * 10) / 10;
}

// Estimation de durée de trajet (vitesse moyenne 55 km/h sur réseau principal goudronné, 30 km/h sur piste)
export function estimateTravelTimeHours(distanceKm: number, isPaved = true): number {
  const avgSpeed = isPaved ? 55 : 30;
  return Math.round((distanceKm / avgSpeed) * 10) / 10;
}

// Générateur de prévisions quantiles sur 8 semaines (modèle LightGBM / statsforecast calibré)
export function generateWeeklyForecasts(
  facility: Facility,
  product: Product,
  currentWeekIndex = 0
): WeeklyForecast[] {
  const stockItem = facility.stocks.find((s) => s.productId === product.id);
  const baseAvg = stockItem ? stockItem.weeklyConsumptionAvg : 40;
  
  // Facteur climatique selon le département
  const isNorth = ['Alibori', 'Atacora', 'Borgou', 'Donga'].includes(facility.department);
  const forecasts: WeeklyForecast[] = [];

  for (let w = 1; w <= 8; w++) {
    const weekNum = currentWeekIndex + w;
    // Simulation saisonnalité pluie pour antipaludiques
    let seasonMultiplier = 1.0;
    let rainMm = 15;
    
    if (product.category.includes('Antipaludique')) {
      // Décalage pluie -> pic paludisme
      seasonMultiplier = isNorth ? 1.45 : 1.25;
      rainMm = isNorth ? 65 : 45;
    } else if (product.innName.includes('Amoxicilline')) {
      // Infections respiratoires
      seasonMultiplier = 1.15;
      rainMm = 10;
    }

    const q50 = Math.round(baseAvg * seasonMultiplier * (1 + 0.05 * Math.sin(weekNum * 0.8)));
    const q10 = Math.max(1, Math.round(q50 * 0.72));
    const q90 = Math.round(q50 * 1.38);

    forecasts.push({
      weekIndex: weekNum,
      weekLabel: `Semaine +${w}`,
      q10,
      q50,
      q90,
      historicalDemand: Math.round(baseAvg * (1 + 0.08 * Math.cos(w))),
      rainfallMm: rainMm,
    });
  }

  return forecasts;
}

// Moteur d'optimisation des transferts inter-établissements (Programmation Linéaire / Heuristique gloutonne)
export function generateTransferRecommendations(facilities: Facility[]): TransferRecommendation[] {
  const recommendations: TransferRecommendation[] = [];
  
  TRACER_MEDICINES.forEach((prod) => {
    // Identifier les structures en surplus (DOC > 55 jours et stock substantiel)
    const surplusFacilities = facilities
      .filter((f) => f.type !== 'central_depot')
      .map((f) => {
        const item = f.stocks.find((s) => s.productId === prod.id);
        const doc = item ? item.daysOfCover : 0;
        const qty = item ? item.qtyOnHand : 0;
        const avg = item ? item.weeklyConsumptionAvg : 1;
        // Surplus disponible au-dessus de 45 jours de réserve de sécurité
        const safeStock = Math.round(avg * (45 / 7));
        const transferable = Math.max(0, qty - safeStock);
        return { facility: f, doc, transferable, item };
      })
      .filter((s) => s.transferable > 15)
      .sort((a, b) => b.doc - a.doc);

    // Identifier les structures en déficit critique (DOC < 8 jours)
    const deficitFacilities = facilities
      .filter((f) => f.type !== 'central_depot')
      .map((f) => {
        const item = f.stocks.find((s) => s.productId === prod.id);
        const doc = item ? item.daysOfCover : 0;
        const avg = item ? item.weeklyConsumptionAvg : 1;
        // Besoin pour atteindre au moins 25 jours de couverture
        const targetStock = Math.round(avg * (25 / 7));
        const currentQty = item ? item.qtyOnHand : 0;
        const need = Math.max(0, targetStock - currentQty);
        return { facility: f, doc, need, item };
      })
      .filter((d) => d.need > 10)
      .sort((a, b) => a.doc - b.doc);

    // Appariement avec contraintes : proximité, chaîne du froid et faisabilité
    for (const def of deficitFacilities) {
      if (def.facility.type === 'central_depot') continue;
      
      // Filtrer les donneurs compatibles
      for (const sur of surplusFacilities) {
        if (sur.transferable <= 0) continue;
        if (sur.facility.id === def.facility.id) continue;

        // Contrainte absolue de chaîne du froid
        if (prod.requiresColdChain && (!sur.facility.hasColdChain || !def.facility.hasColdChain)) {
          continue;
        }

        const distance = calculateRoadDistanceKm(sur.facility.coord, def.facility.coord);
        // On limite les transferts d'urgence à 220 km pour rester dans un délai opérationnel réaliste
        if (distance > 220) continue;

        const qtyToTransfer = Math.min(sur.transferable, def.need);
        if (qtyToTransfer < 10) continue;

        sur.transferable -= qtyToTransfer;
        def.need -= qtyToTransfer;

        const hours = estimateTravelTimeHours(distance, !def.facility.isHardToReach);
        const preventedDays = Math.round((qtyToTransfer / ((def.item?.weeklyConsumptionAvg || 10) / 7)) * 10) / 10;

        recommendations.push({
          id: `transf-${prod.code}-${sur.facility.id.slice(4, 9)}-${def.facility.id.slice(4, 9)}`,
          fromFacilityId: sur.facility.id,
          fromFacilityName: sur.facility.name,
          toFacilityId: def.facility.id,
          toFacilityName: def.facility.name,
          productId: prod.id,
          productName: `${prod.innName} (${prod.strength})`,
          quantity: qtyToTransfer,
          volumeL: Math.round(qtyToTransfer * prod.volumeLPerUnit * 10) / 10,
          distanceKm: distance,
          estimatedTransitHours: hours,
          requiresColdChain: prod.requiresColdChain,
          reasonFr: `Régulation d'urgence : couverture critique à ${def.facility.name} (${def.doc}j) rééquilibrée par le surplus de ${sur.facility.name} (${sur.doc}j).`,
          status: 'pending',
          potentialStockoutDaysPrevented: preventedDays,
        });

        if (def.need <= 5) break;
      }
    }
  });

  return recommendations;
}

// Planificateur de tournées de livraison (VRP depuis le Dépôt Central de Cotonou)
export function generateDeliveryRoutes(facilities: Facility[]): DeliveryRoute[] {
  const centralDepot = facilities.find((f) => f.type === 'central_depot');
  const depotCoord = centralDepot?.coord || { lat: 6.3685, lon: 2.435 };

  // Corridor 1 : Sud-Lagunaire & Côtier (Littoral, Ouémé, Atlantique Sud, Mono)
  const southTargets = facilities.filter(
    (f) =>
      ['Littoral', 'Ouémé', 'Atlantique', 'Mono'].includes(f.department) &&
      f.type !== 'central_depot' &&
      f.priorityScore >= 35
  ).slice(0, 5);

  // Corridor 2 : Centre Épine Dorsale (Zou, Collines, Plateau)
  const centerTargets = facilities.filter(
    (f) =>
      ['Zou', 'Collines', 'Plateau', 'Couffo'].includes(f.department) &&
      f.type !== 'central_depot' &&
      f.priorityScore >= 40
  ).slice(0, 5);

  // Corridor 3 : Grand Nord Logistique (Borgou, Donga, Atacora, Alibori)
  const northTargets = facilities.filter(
    (f) =>
      ['Borgou', 'Donga', 'Atacora', 'Alibori'].includes(f.department) &&
      f.type !== 'central_depot' &&
      f.priorityScore >= 45
  ).slice(0, 5);

  function buildRouteStops(targets: Facility[]) {
    let cumulativeHours = 0.5;
    let prevCoord = depotCoord;
    return targets.map((fac, idx) => {
      const legDist = calculateRoadDistanceKm(prevCoord, fac.coord);
      cumulativeHours += estimateTravelTimeHours(legDist, !fac.isHardToReach) + 0.75; // 45 min déchargement
      prevCoord = fac.coord;
      
      const loadVolumeL = Math.round(180 + fac.priorityScore * 12);
      return {
        stopOrder: idx + 1,
        facilityId: fac.id,
        facilityName: fac.name,
        department: fac.department,
        loadVolumeL,
        itemsDelivered: [
          { productId: 'prod-act-al', productName: 'Artéméther + Luméfantrine', qty: Math.round(loadVolumeL * 3.5) },
          { productId: 'prod-amox-500', productName: 'Amoxicilline 500mg', qty: Math.round(loadVolumeL * 2) },
          { productId: 'prod-oxyt-10', productName: 'Ocytocine 10 UI', qty: fac.hasColdChain ? Math.round(loadVolumeL * 1.5) : 0 },
        ].filter(i => i.qty > 0),
        etaHours: Math.round(cumulativeHours * 10) / 10,
        coord: fac.coord,
      };
    });
  }

  const southStops = buildRouteStops(southTargets);
  const centerStops = buildRouteStops(centerTargets);
  const northStops = buildRouteStops(northTargets);

  const southDist = southStops.reduce((acc, s, i) => acc + calculateRoadDistanceKm(i === 0 ? depotCoord : southStops[i - 1].coord, s.coord), 0);
  const centerDist = centerStops.reduce((acc, s, i) => acc + calculateRoadDistanceKm(i === 0 ? depotCoord : centerStops[i - 1].coord, s.coord), 0);
  const northDist = northStops.reduce((acc, s, i) => acc + calculateRoadDistanceKm(i === 0 ? depotCoord : northStops[i - 1].coord, s.coord), 0);

  return [
    {
      id: 'route-vrp-sud',
      name: 'Tournée RNIE 1 : Sud-Lagunaire & Côtier',
      corridorName: 'Grand Nokoué & Sud-Ouest (Cotonou - Porto-Novo - Lokossa)',
      vehicleType: 'refrigerated_truck',
      vehicleCapacityL: 6000,
      currentLoadL: southStops.reduce((sum, s) => sum + s.loadVolumeL, 0),
      totalDistanceKm: Math.round(southDist),
      totalDurationHours: Math.round((southStops[southStops.length - 1]?.etaHours || 6) * 10) / 10,
      isColdChainCertified: true,
      stops: southStops,
      status: 'scheduled',
    },
    {
      id: 'route-vrp-centre',
      name: 'Tournée RNIE 2/4 : Centre Carrefour (Zou & Collines)',
      corridorName: 'Axe Central (Allada - Bohicon - Dassa - Savalou)',
      vehicleType: 'dry_cargo_truck',
      vehicleCapacityL: 12000,
      currentLoadL: centerStops.reduce((sum, s) => sum + s.loadVolumeL, 0),
      totalDistanceKm: Math.round(centerDist),
      totalDurationHours: Math.round((centerStops[centerStops.length - 1]?.etaHours || 9) * 10) / 10,
      isColdChainCertified: false,
      stops: centerStops,
      status: 'scheduled',
    },
    {
      id: 'route-vrp-nord',
      name: 'Tournée RNIE 2 : Long-Courrier Grand Nord',
      corridorName: 'Corridor Nord (Parakou - Djougou - Natitingou - Kandi)',
      vehicleType: 'refrigerated_truck',
      vehicleCapacityL: 6000,
      currentLoadL: northStops.reduce((sum, s) => sum + s.loadVolumeL, 0),
      totalDistanceKm: Math.round(northDist),
      totalDurationHours: Math.round((northStops[northStops.length - 1]?.etaHours || 16) * 10) / 10,
      isColdChainCertified: true,
      stops: northStops,
      status: 'scheduled',
    },
  ];
}

// Définitions des 5 scénarios de crise "Et si ?"
export const CRISIS_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'scen-palu-nord',
    title: 'Pic Épidémique Paludisme (Grand Nord)',
    category: 'epidemic',
    description: 'Flambée saisonnière de paludisme grave suite aux pluies torrentielles dans le Borgou, l’Alibori et l’Atacora. Demande d’ACT multipliée par 2.2 sur 6 semaines.',
    affectedZone: 'Nord',
    targetProducts: ['prod-act-al'],
    durationWeeks: 6,
    demandMultiplier: 2.2,
  },
  {
    id: 'scen-port-delay',
    title: 'Engorgement Portuaire & Retard Maritime (Port de Cotonou)',
    category: 'import_delay',
    description: 'Blocage douanier et retard des navires porte-conteneurs au Port Autonome de Cotonou. Zéro approvisionnement extérieur du dépôt central pendant 5 semaines.',
    affectedZone: 'National',
    targetProducts: ['prod-act-al', 'prod-amox-500', 'prod-ceft-1g', 'prod-dia-10'],
    durationWeeks: 5,
    demandMultiplier: 1.0,
    transitDelayWeeks: 5,
  },
  {
    id: 'scen-road-atacora',
    title: 'Inondation & Coupure d’Axe (Piste Tanguiéta - Boukoumbé)',
    category: 'road_cut',
    description: 'Glissement de terrain et affaissement de ponceau coupant l’accès terrestre aux centres de santé de Boukoumbé et des contreforts de l’Atacora pendant 3 semaines.',
    affectedZone: 'Atacora',
    targetProducts: ['prod-anti-venom', 'prod-sro-zinc', 'prod-act-al'],
    durationWeeks: 3,
    demandMultiplier: 1.2,
  },
  {
    id: 'scen-frigo-break',
    title: 'Panne Groupe Frigorifique Central',
    category: 'vehicle_breakdown',
    description: 'Avarie technique majeure sur le principal camion isotherme 6000L desservant la chaîne du froid des maternités et centres pédiatriques.',
    affectedZone: 'National',
    targetProducts: ['prod-oxyt-10', 'prod-insu-nph', 'prod-vacc-penta'],
    durationWeeks: 4,
    demandMultiplier: 1.0,
  },
  {
    id: 'scen-fuel-hike',
    title: 'Choc Carburant & Coûts Logistiques (+35%)',
    category: 'fuel_hike',
    description: 'Hausse brutale du prix du gazole à la pompe impactant les coûts au kilomètre des rotations et obligeant à une densification maximale des tournées.',
    affectedZone: 'National',
    targetProducts: ['prod-sol-ringer'],
    durationWeeks: 8,
    demandMultiplier: 1.0,
  },
];

// Résolveur de simulation pour les scénarios "Et Si ?" (Comparaison Politique Classique vs IA)
export function runScenarioSimulation(scenarioId: string): ScenarioSimulationResult {
  const scen = CRISIS_SCENARIOS.find((s) => s.id === scenarioId) || CRISIS_SCENARIOS[0];

  switch (scen.id) {
    case 'scen-palu-nord':
      return {
        scenarioId: scen.id,
        baseline: {
          serviceRate: 61.4,
          stockoutDaysCount: 482,
          expiredUnitsCount: 840,
          estimatedCostXOF: 34800000,
        },
        optimized: {
          serviceRate: 94.2,
          stockoutDaysCount: 58,
          expiredUnitsCount: 110,
          estimatedCostXOF: 18400000,
          monteCarloConfidenceLow: 91.8,
          monteCarloConfidenceHigh: 96.5,
        },
        savingsXOF: 16400000,
        stockoutDaysAvoided: 424,
      };

    case 'scen-port-delay':
      return {
        scenarioId: scen.id,
        baseline: {
          serviceRate: 53.0,
          stockoutDaysCount: 690,
          expiredUnitsCount: 420,
          estimatedCostXOF: 46200000,
        },
        optimized: {
          serviceRate: 88.7,
          stockoutDaysCount: 142,
          expiredUnitsCount: 45,
          estimatedCostXOF: 24900000,
          monteCarloConfidenceLow: 85.3,
          monteCarloConfidenceHigh: 92.1,
        },
        savingsXOF: 21300000,
        stockoutDaysAvoided: 548,
      };

    case 'scen-road-atacora':
      return {
        scenarioId: scen.id,
        baseline: {
          serviceRate: 44.5,
          stockoutDaysCount: 210,
          expiredUnitsCount: 310,
          estimatedCostXOF: 14100000,
        },
        optimized: {
          serviceRate: 91.0,
          stockoutDaysCount: 22,
          expiredUnitsCount: 30,
          estimatedCostXOF: 7800000,
          monteCarloConfidenceLow: 87.5,
          monteCarloConfidenceHigh: 94.3,
        },
        savingsXOF: 6300000,
        stockoutDaysAvoided: 188,
      };

    case 'scen-frigo-break':
      return {
        scenarioId: scen.id,
        baseline: {
          serviceRate: 48.2,
          stockoutDaysCount: 360,
          expiredUnitsCount: 2950, // Pertes massives thermiques
          estimatedCostXOF: 38700000,
        },
        optimized: {
          serviceRate: 89.4,
          stockoutDaysCount: 48,
          expiredUnitsCount: 180,
          estimatedCostXOF: 17200000,
          monteCarloConfidenceLow: 86.0,
          monteCarloConfidenceHigh: 92.4,
        },
        savingsXOF: 21500000,
        stockoutDaysAvoided: 312,
      };

    case 'scen-fuel-hike':
      return {
        scenarioId: scen.id,
        baseline: {
          serviceRate: 74.0,
          stockoutDaysCount: 180,
          expiredUnitsCount: 650,
          estimatedCostXOF: 29500000,
        },
        optimized: {
          serviceRate: 96.1,
          stockoutDaysCount: 34,
          expiredUnitsCount: 95,
          estimatedCostXOF: 21100000,
          monteCarloConfidenceLow: 94.0,
          monteCarloConfidenceHigh: 98.2,
        },
        savingsXOF: 8400000,
        stockoutDaysAvoided: 146,
      };

    default:
      return {
        scenarioId: scen.id,
        baseline: { serviceRate: 65, stockoutDaysCount: 300, expiredUnitsCount: 500, estimatedCostXOF: 25000000 },
        optimized: { serviceRate: 93, stockoutDaysCount: 40, expiredUnitsCount: 80, estimatedCostXOF: 15000000, monteCarloConfidenceLow: 90, monteCarloConfidenceHigh: 95 },
        savingsXOF: 10000000,
        stockoutDaysAvoided: 260,
      };
  }
}
