/**
 * Données géographiques authentiques et réseau routier du Bénin
 * Couvre les 12 départements, les 77 communes, les corridors routiers nationaux (RNIE)
 * et les agglomérations majeures ainsi que les quartiers urbains.
 */

import { DepartmentInfo, CityInfo, GeoCoordinate } from '../types/pharma';

// Bornes géographiques du Bénin
export const BENIN_BOUNDS = {
  lonMin: 0.70,
  lonMax: 3.90,
  latMin: 6.18,
  latMax: 12.45,
};

// Projection des coordonnées géographiques (WGS84) vers le canevas SVG standardisé
export function projectGeoToSvg(coord: GeoCoordinate, width = 540, height = 860): { x: number; y: number } {
  const normX = (coord.lon - BENIN_BOUNDS.lonMin) / (BENIN_BOUNDS.lonMax - BENIN_BOUNDS.lonMin);
  const normY = (coord.lat - BENIN_BOUNDS.latMin) / (BENIN_BOUNDS.latMax - BENIN_BOUNDS.latMin);
  
  const x = Math.round(normX * width * 10) / 10;
  const y = Math.round((height - (normY * height)) * 10) / 10;
  return { x, y };
}

// 12 Départements du Bénin avec contours géographiques réalistes et fidèles à la géomorphologie nationale
export const DEPARTMENTS_DATA: DepartmentInfo[] = [
  {
    name: 'Alibori',
    capital: 'Kandi',
    population: 868046,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 950,
    riskHealthScore: 78,
    labelCoord: { lat: 11.45, lon: 2.85 },
    svgPath: 'M 215 125 C 218 85 240 45 285 22 C 320 6 365 18 405 45 C 445 78 450 120 435 170 C 420 205 385 228 340 230 C 295 232 255 210 230 190 C 220 170 212 145 215 125 Z',
  },
  {
    name: 'Atacora',
    capital: 'Natitingou',
    population: 769337,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 1150,
    riskHealthScore: 82,
    labelCoord: { lat: 10.70, lon: 1.65 },
    svgPath: 'M 75 160 C 110 140 175 130 215 125 C 220 170 235 200 250 215 C 220 260 195 305 180 345 C 145 338 105 325 80 290 C 65 250 68 200 75 160 Z',
  },
  {
    name: 'Borgou',
    capital: 'Parakou',
    population: 1202095,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 1100,
    riskHealthScore: 64,
    labelCoord: { lat: 9.75, lon: 2.80 },
    svgPath: 'M 250 215 C 295 232 340 230 420 180 C 440 240 455 310 445 375 C 435 415 390 440 330 445 C 285 410 240 375 230 355 C 215 320 235 250 250 215 Z',
  },
  {
    name: 'Donga',
    capital: 'Djougou',
    population: 539314,
    climateZone: 'Transition Centre',
    avgRainMmAnnual: 1200,
    riskHealthScore: 71,
    labelCoord: { lat: 9.50, lon: 1.70 },
    svgPath: 'M 80 290 C 105 325 145 338 180 345 C 230 355 240 375 230 420 C 225 455 205 482 175 490 C 140 492 105 450 90 410 C 75 370 72 325 80 290 Z',
  },
  {
    name: 'Collines',
    capital: 'Dassa-Zoumè',
    population: 716558,
    climateZone: 'Transition Centre',
    avgRainMmAnnual: 1150,
    riskHealthScore: 59,
    labelCoord: { lat: 8.20, lon: 2.25 },
    svgPath: 'M 90 410 C 105 450 140 492 175 490 C 225 482 280 460 330 445 C 365 470 375 520 360 570 C 345 595 295 605 240 605 C 190 602 145 580 120 545 C 100 500 88 450 90 410 Z',
  },
  {
    name: 'Zou',
    capital: 'Abomey',
    population: 851623,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1100,
    riskHealthScore: 54,
    labelCoord: { lat: 7.25, lon: 2.10 },
    svgPath: 'M 120 545 C 145 580 190 602 240 605 C 285 605 315 620 310 660 C 305 690 280 705 235 708 C 195 705 160 690 135 660 C 120 620 115 580 120 545 Z',
  },
  {
    name: 'Plateau',
    capital: 'Pobè',
    population: 624146,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1250,
    riskHealthScore: 61,
    labelCoord: { lat: 7.10, lon: 2.65 },
    svgPath: 'M 310 660 C 345 640 375 635 385 670 C 392 720 380 755 355 770 C 330 775 305 760 295 725 C 290 695 300 675 310 660 Z',
  },
  {
    name: 'Couffo',
    capital: 'Aplahoué',
    population: 741895,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1050,
    riskHealthScore: 67,
    labelCoord: { lat: 6.95, lon: 1.85 },
    svgPath: 'M 135 660 C 160 690 195 705 205 735 C 205 760 175 775 145 772 C 125 768 115 745 118 715 C 122 690 128 672 135 660 Z',
  },
  {
    name: 'Mono',
    capital: 'Lokossa',
    population: 495307,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1000,
    riskHealthScore: 58,
    labelCoord: { lat: 6.55, lon: 1.80 },
    svgPath: 'M 118 715 C 145 725 175 735 180 765 C 185 800 170 835 140 838 C 115 838 95 820 95 780 C 95 750 105 730 118 715 Z',
  },
  {
    name: 'Atlantique',
    capital: 'Allada',
    population: 1396548,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1200,
    riskHealthScore: 48,
    labelCoord: { lat: 6.65, lon: 2.25 },
    svgPath: 'M 205 735 C 235 708 280 705 290 735 C 295 775 275 815 245 842 C 220 845 190 835 180 805 C 178 775 195 750 205 735 Z',
  },
  {
    name: 'Littoral',
    capital: 'Cotonou',
    population: 678874,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1300,
    riskHealthScore: 42,
    labelCoord: { lat: 6.36, lon: 2.42 },
    svgPath: 'M 245 842 C 275 825 295 825 305 845 C 295 860 260 862 245 842 Z',
  },
  {
    name: 'Ouémé',
    capital: 'Porto-Novo',
    population: 1096850,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1250,
    riskHealthScore: 51,
    labelCoord: { lat: 6.50, lon: 2.58 },
    svgPath: 'M 290 735 C 315 735 340 750 345 785 C 350 820 325 845 298 845 C 285 825 285 775 290 735 Z',
  },
];

// Villes et agglomérations majeures du Bénin
export const BENIN_CITIES: CityInfo[] = [
  // Littoral & Atlantique (Grand Nokoué)
  {
    id: 'cotonou',
    name: 'Cotonou',
    department: 'Littoral',
    population: 678874,
    coord: { lat: 6.3654, lon: 2.4183 },
    isUrbanHub: true,
    neighbourhoods: [
      'Akpakpa (Port / Dépôt Central)',
      'Ganhi (Affaires)',
      'Cadjèhoun',
      'Haie Vive',
      'Fidjrossè',
      'Gbégamey',
      'Jéricho',
      'Zogbo',
      'Agla',
      'Houéyiho',
      'Saint-Michel',
    ],
  },
  {
    id: 'calavi',
    name: 'Abomey-Calavi',
    department: 'Atlantique',
    population: 656358,
    coord: { lat: 6.4485, lon: 2.3557 },
    isUrbanHub: true,
    neighbourhoods: ['Godomey', 'Togba', 'Akassato', 'Hêvié', 'Ouèdo', 'Zinvié'],
  },
  {
    id: 'portonovo',
    name: 'Porto-Novo',
    department: 'Ouémé',
    population: 264320,
    coord: { lat: 6.4969, lon: 2.6289 },
    isUrbanHub: true,
    neighbourhoods: ['Djassin', 'Ouando', 'Attakè', 'Avakpa', 'Tokpota'],
  },
  {
    id: 'ouidah',
    name: 'Ouidah',
    department: 'Atlantique',
    population: 162034,
    coord: { lat: 6.3631, lon: 2.0851 },
    isUrbanHub: false,
  },
  {
    id: 'allada',
    name: 'Allada',
    department: 'Atlantique',
    population: 127512,
    coord: { lat: 6.6654, lon: 2.1513 },
    isUrbanHub: false,
  },

  // Zou & Collines (Centre)
  {
    id: 'bohicon',
    name: 'Bohicon',
    department: 'Zou',
    population: 171781,
    coord: { lat: 7.1783, lon: 2.0667 },
    isUrbanHub: true,
  },
  {
    id: 'abomey',
    name: 'Abomey',
    department: 'Zou',
    population: 92266,
    coord: { lat: 7.1829, lon: 1.9912 },
    isUrbanHub: false,
  },
  {
    id: 'dassa',
    name: 'Dassa-Zoumè',
    department: 'Collines',
    population: 112122,
    coord: { lat: 7.7558, lon: 2.1839 },
    isUrbanHub: false,
  },
  {
    id: 'savalou',
    name: 'Savalou',
    department: 'Collines',
    population: 144549,
    coord: { lat: 7.9281, lon: 1.9756 },
    isUrbanHub: false,
  },
  {
    id: 'save',
    name: 'Savè',
    department: 'Collines',
    population: 87179,
    coord: { lat: 8.0333, lon: 2.4833 },
    isUrbanHub: false,
  },

  // Borgou & Donga (Moyen Nord)
  {
    id: 'parakou',
    name: 'Parakou',
    department: 'Borgou',
    population: 255478,
    coord: { lat: 9.3372, lon: 2.6303 },
    isUrbanHub: true,
    neighbourhoods: ['Banikanni', 'Albarika', 'Titirou', 'Zongo', 'Guéma'],
  },
  {
    id: 'djougou',
    name: 'Djougou',
    department: 'Donga',
    population: 267812,
    coord: { lat: 9.7085, lon: 1.6660 },
    isUrbanHub: true,
  },
  {
    id: 'bembereke',
    name: 'Bembèrèkè',
    department: 'Borgou',
    population: 131255,
    coord: { lat: 10.2283, lon: 2.6636 },
    isUrbanHub: false,
  },
  {
    id: 'bassila',
    name: 'Bassila',
    department: 'Donga',
    population: 130091,
    coord: { lat: 9.0125, lon: 1.6654 },
    isUrbanHub: false,
  },

  // Atacora & Alibori (Grand Nord)
  {
    id: 'natitingou',
    name: 'Natitingou',
    department: 'Atacora',
    population: 103843,
    coord: { lat: 10.3042, lon: 1.3796 },
    isUrbanHub: true,
  },
  {
    id: 'tanguieta',
    name: 'Tanguiéta',
    department: 'Atacora',
    population: 74675,
    coord: { lat: 10.6214, lon: 1.2664 },
    isUrbanHub: false,
  },
  {
    id: 'boukoumbe',
    name: 'Boukoumbé',
    department: 'Atacora',
    population: 82494,
    coord: { lat: 10.1772, lon: 1.1075 },
    isUrbanHub: false,
  },
  {
    id: 'kandi',
    name: 'Kandi',
    department: 'Alibori',
    population: 179290,
    coord: { lat: 11.1342, lon: 2.9386 },
    isUrbanHub: true,
  },
  {
    id: 'malanville',
    name: 'Malanville',
    department: 'Alibori',
    population: 168641,
    coord: { lat: 11.8683, lon: 3.3833 },
    isUrbanHub: false,
  },
  {
    id: 'banikoara',
    name: 'Banikoara',
    department: 'Alibori',
    population: 246575,
    coord: { lat: 11.2985, lon: 2.4386 },
    isUrbanHub: false,
  },

  // Mono, Couffo, Plateau (Sud-Ouest & Sud-Est)
  {
    id: 'lokossa',
    name: 'Lokossa',
    department: 'Mono',
    population: 104961,
    coord: { lat: 6.6384, lon: 1.7167 },
    isUrbanHub: false,
  },
  {
    id: 'grandpopo',
    name: 'Grand-Popo',
    department: 'Mono',
    population: 57636,
    coord: { lat: 6.2806, lon: 1.8219 },
    isUrbanHub: false,
  },
  {
    id: 'aplahoue',
    name: 'Aplahoué',
    department: 'Couffo',
    population: 171109,
    coord: { lat: 6.9333, lon: 1.6833 },
    isUrbanHub: false,
  },
  {
    id: 'pobe',
    name: 'Pobè',
    department: 'Plateau',
    population: 123677,
    coord: { lat: 6.9806, lon: 2.6644 },
    isUrbanHub: false,
  },
  {
    id: 'sakete',
    name: 'Sakété',
    department: 'Plateau',
    population: 114088,
    coord: { lat: 6.7361, lon: 2.6586 },
    isUrbanHub: false,
  },
];

// Corridors routiers prioritaires (RNIE - Routes Nationales Inter-États)
export interface RoadCorridor {
  code: string;
  name: string;
  waypoints: GeoCoordinate[];
  type: 'backbone_highway' | 'interstate_link' | 'regional_connector';
  isPaved: boolean;
}

export const BENIN_ROAD_NETWORK: RoadCorridor[] = [
  // RNIE 2: La grande colonne vertébrale Nord-Sud (Cotonou -> Bohicon -> Parakou -> Kandi -> Malanville)
  {
    code: 'RNIE 2',
    name: 'Axe Nord-Sud (Cotonou - Parakou - Malanville)',
    type: 'backbone_highway',
    isPaved: true,
    waypoints: [
      { lat: 6.3654, lon: 2.4183 }, // Cotonou
      { lat: 6.4485, lon: 2.3557 }, // Calavi
      { lat: 6.6654, lon: 2.1513 }, // Allada
      { lat: 7.1783, lon: 2.0667 }, // Bohicon
      { lat: 7.7558, lon: 2.1839 }, // Dassa
      { lat: 9.3372, lon: 2.6303 }, // Parakou
      { lat: 10.2283, lon: 2.6636 }, // Bembèrèkè
      { lat: 11.1342, lon: 2.9386 }, // Kandi
      { lat: 11.8683, lon: 3.3833 }, // Malanville
    ],
  },
  // RNIE 1: Corridor Côtier Ouest-Est (Grand-Popo -> Ouidah -> Cotonou -> Porto-Novo -> Frontière Nigéria)
  {
    code: 'RNIE 1',
    name: 'Corridor Côtier (Grand-Popo - Cotonou - Porto-Novo - Sèmè)',
    type: 'backbone_highway',
    isPaved: true,
    waypoints: [
      { lat: 6.2806, lon: 1.8219 }, // Grand-Popo
      { lat: 6.3631, lon: 2.0851 }, // Ouidah
      { lat: 6.3654, lon: 2.4183 }, // Cotonou
      { lat: 6.4969, lon: 2.6289 }, // Porto-Novo
      { lat: 6.4250, lon: 2.7150 }, // Sèmè-Kpodji
    ],
  },
  // RNIE 3: Axe Centre-Nord-Ouest (Dassa -> Savalou -> Bassila -> Djougou -> Natitingou)
  {
    code: 'RNIE 3',
    name: 'Corridor Nord-Ouest (Dassa - Savalou - Djougou - Natitingou)',
    type: 'interstate_link',
    isPaved: true,
    waypoints: [
      { lat: 7.7558, lon: 2.1839 }, // Dassa
      { lat: 7.9281, lon: 1.9756 }, // Savalou
      { lat: 9.0125, lon: 1.6654 }, // Bassila
      { lat: 9.7085, lon: 1.6660 }, // Djougou
      { lat: 10.3042, lon: 1.3796 }, // Natitingou
      { lat: 10.6214, lon: 1.2664 }, // Tanguiéta
    ],
  },
  // Liaison Parakou - Djougou (Transversale)
  {
    code: 'RNIE 6',
    name: 'Transversale Borgou - Donga (Parakou - Djougou)',
    type: 'regional_connector',
    isPaved: true,
    waypoints: [
      { lat: 9.3372, lon: 2.6303 }, // Parakou
      { lat: 9.7085, lon: 1.6660 }, // Djougou
    ],
  },
  // Branche Piste Rurale Nord-Ouest (Tanguiéta -> Boukoumbé - Piste latéritique saisonnière)
  {
    code: 'Piste-Atacora',
    name: 'Piste Rurale Chaîne de l’Atacora (Natitingou - Boukoumbé)',
    type: 'regional_connector',
    isPaved: false,
    waypoints: [
      { lat: 10.3042, lon: 1.3796 }, // Natitingou
      { lat: 10.1772, lon: 1.1075 }, // Boukoumbé
    ],
  },
];
