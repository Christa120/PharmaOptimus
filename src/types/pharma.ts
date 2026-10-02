/**
 * Types et interfaces pour la Plateforme Intelligente de Gestion Pharmaceutique (Bénin)
 * Conforme au cahier des charges national et aux spécifications de modélisation
 */

export type DepartmentName =
  | 'Alibori'
  | 'Atacora'
  | 'Atlantique'
  | 'Borgou'
  | 'Collines'
  | 'Couffo'
  | 'Donga'
  | 'Littoral'
  | 'Mono'
  | 'Ouémé'
  | 'Plateau'
  | 'Zou';

export type FacilityType =
  | 'central_depot'
  | 'referral_hospital'
  | 'health_center'
  | 'pharmacy';

export type ClinicalCriticality = 'vital' | 'essential' | 'standard';

export interface GeoCoordinate {
  lat: number;
  lon: number;
}

export interface DepartmentInfo {
  name: DepartmentName;
  capital: string;
  population: number;
  climateZone: 'Sud (Bimodal)' | 'Nord (Unimodal + Harmattan)' | 'Transition Centre';
  avgRainMmAnnual: number;
  riskHealthScore: number; // 0 à 100
  svgPath: string;
  labelCoord: GeoCoordinate;
}

export interface CityInfo {
  id: string;
  name: string;
  department: DepartmentName;
  population: number;
  coord: GeoCoordinate;
  isUrbanHub: boolean;
  neighbourhoods?: string[];
}

export interface Product {
  id: string;
  code: string;
  innName: string; // Dénomination Commune Internationale
  tradeExample: string;
  category: string;
  form: string;
  strength: string;
  packSize: number;
  unitCostXOF: number;
  volumeLPerUnit: number;
  requiresColdChain: boolean;
  shelfLifeDays: number;
  criticality: ClinicalCriticality;
  substituteGroup?: string;
  descriptionFr: string;
}

export interface FacilityStockItem {
  productId: string;
  qtyOnHand: number;
  qtyExpiring30d: number;
  qtyExpiring90d: number;
  weeklyConsumptionAvg: number;
  daysOfCover: number;
  status: 'critical_stockout' | 'low_stock' | 'balanced' | 'overstock_expiry';
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  department: DepartmentName;
  commune: string;
  city: string;
  neighbourhood?: string;
  coord: GeoCoordinate;
  servedPopulation: number;
  storageCapacityL: number;
  hasColdChain: boolean;
  isHardToReach: boolean; // Pistes difficiles d'accès
  osmId?: string;
  source: string;
  isSimulated: boolean; // Toujours true pour les stocks et données dérivées
  stocks: FacilityStockItem[];
  priorityScore: number; // 0 - 100
  priorityBreakdown: {
    stockoutRisk: number;     // 40%
    clinicalCriticality: number; // 25%
    populationScore: number;  // 20%
    timeSinceDelivery: number; // 15%
  };
  lastDeliveryDaysAgo: number;
}

export interface WeeklyForecast {
  weekIndex: number;
  weekLabel: string;
  q10: number; // Quantile 10 (scénario plancher)
  q50: number; // Médiane (prévision centrale)
  q90: number; // Quantile 90 (scénario stress)
  historicalDemand?: number;
  rainfallMm?: number;
}

export interface TransferRecommendation {
  id: string;
  fromFacilityId: string;
  fromFacilityName: string;
  toFacilityId: string;
  toFacilityName: string;
  productId: string;
  productName: string;
  quantity: number;
  volumeL: number;
  distanceKm: number;
  estimatedTransitHours: number;
  requiresColdChain: boolean;
  reasonFr: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  potentialStockoutDaysPrevented: number;
}

export interface DeliveryRouteStop {
  stopOrder: number;
  facilityId: string;
  facilityName: string;
  department: DepartmentName;
  loadVolumeL: number;
  itemsDelivered: { productId: string; productName: string; qty: number }[];
  etaHours: number;
  coord: GeoCoordinate;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  corridorName: string;
  vehicleType: 'refrigerated_truck' | 'dry_cargo_truck' | 'rapid_van';
  vehicleCapacityL: number;
  currentLoadL: number;
  totalDistanceKm: number;
  totalDurationHours: number;
  isColdChainCertified: boolean;
  stops: DeliveryRouteStop[];
  status: 'scheduled' | 'in_transit' | 'completed';
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: 'epidemic' | 'import_delay' | 'road_cut' | 'vehicle_breakdown' | 'fuel_hike';
  description: string;
  affectedZone: 'Nord' | 'Sud' | 'National' | 'Atacora';
  targetProducts: string[];
  durationWeeks: number;
  demandMultiplier: number;
  transitDelayWeeks?: number;
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  baseline: {
    serviceRate: number; // %
    stockoutDaysCount: number;
    expiredUnitsCount: number;
    estimatedCostXOF: number;
  };
  optimized: {
    serviceRate: number; // %
    stockoutDaysCount: number;
    expiredUnitsCount: number;
    estimatedCostXOF: number;
    monteCarloConfidenceLow: number;
    monteCarloConfidenceHigh: number;
  };
  savingsXOF: number;
  stockoutDaysAvoided: number;
}
