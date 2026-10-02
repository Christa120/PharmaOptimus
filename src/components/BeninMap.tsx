import React, { useState, useMemo } from 'react';
import {
  DepartmentName,
  Facility,
  FacilityType,
  Product,
  TransferRecommendation,
  DeliveryRoute,
  GeoCoordinate,
} from '../types/pharma';
import {
  DEPARTMENTS_DATA,
  BENIN_CITIES,
  BENIN_ROAD_NETWORK,
  projectGeoToSvg,
  BENIN_BOUNDS,
} from '../data/beninGeography';
import {
  Search,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  Cross,
  Activity,
  Pill,
  Truck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  MapPin,
  ChevronDown,
} from 'lucide-react';

interface BeninMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility | null) => void;
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  transfers: TransferRecommendation[];
  routes: DeliveryRoute[];
}

export const BeninMap: React.FC<BeninMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  products,
  selectedProductId,
  onSelectProduct,
  transfers,
  routes,
}) => {
  // Filtres actifs
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Couches activables
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showTransfers, setShowTransfers] = useState<boolean>(false);
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showCities, setShowCities] = useState<boolean>(true);
  const [urbanZoomActive, setUrbanZoomActive] = useState<boolean>(false);

  // État de zoom / pan du SVG
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null);

  // Produit sélectionné
  const currentProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  // Filtrage des structures
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      if (selectedDepartment !== 'all' && fac.department !== selectedDepartment) return false;
      if (selectedType !== 'all' && fac.type !== selectedType) return false;

      // Filtre sur le statut du produit sélectionné
      const stock = fac.stocks.find((s) => s.productId === selectedProductId);
      if (selectedStatus !== 'all') {
        if (!stock) return false;
        if (selectedStatus === 'critical' && stock.daysOfCover >= 7) return false;
        if (selectedStatus === 'warning' && (stock.daysOfCover < 7 || stock.daysOfCover >= 21)) return false;
        if (selectedStatus === 'balanced' && (stock.daysOfCover < 21 || stock.daysOfCover > 60)) return false;
        if (selectedStatus === 'surplus' && stock.daysOfCover <= 60) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = fac.name.toLowerCase().includes(q);
        const matchesCity = fac.city.toLowerCase().includes(q);
        const matchesCommune = fac.commune.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesCommune) return false;
      }

      return true;
    });
  }, [facilities, selectedDepartment, selectedType, selectedStatus, selectedProductId, searchQuery]);

  // Contrôles de zoom
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, z + 0.35));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.85, z - 0.35));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setUrbanZoomActive(false);
  };

  // Zoom ciblé sur le Grand Nokoué (Cotonou / Calavi / Porto-Novo)
  const toggleUrbanZoom = () => {
    if (!urbanZoomActive) {
      setUrbanZoomActive(true);
      setZoomLevel(2.8);
      // Centrer sur Cotonou (en bas de carte SVG)
      setPanOffset({ x: -160, y: -480 });
    } else {
      handleResetView();
    }
  };

  // Icône et couleur selon le type et l'état
  const getFacilityMarkerVisuals = (fac: Facility) => {
    const stock = fac.stocks.find((s) => s.productId === selectedProductId);
    const doc = stock?.daysOfCover ?? 0;

    let color = '#10b981'; // Vert nominal
    let borderColor = '#059669';
    let statusLabel = 'Équilibré';

    if (fac.type === 'central_depot') {
      color = '#38bdf8'; // Bleu ciel Dépôt
      borderColor = '#0284c7';
      statusLabel = 'Dépôt Central National';
    } else if (doc < 7) {
      color = '#ef4444'; // Rouge Rupture imminente
      borderColor = '#b91c1c';
      statusLabel = `Rupture critique (${doc}j)`;
    } else if (doc < 21) {
      color = '#f59e0b'; // Ambre Tension
      borderColor = '#d97706';
      statusLabel = `Tension stock (${doc}j)`;
    } else if (doc > 60) {
      color = '#818cf8'; // Violet/Indigo Surstock
      borderColor = '#6366f1';
      statusLabel = `Surstock (${doc}j)`;
    }

    return { color, borderColor, statusLabel, doc };
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[600px] w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Panneau de Contrôles & Filtres (Responsive: Accordéon / Bandeau en haut sur mobile, Barre latérale sur desktop) */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-slate-900/90 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
        
        {/* Titre et Produit Traceur */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Carte Nationale du Bénin</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {filteredFacilities.length} sites
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Observation spatiale de la couverture et des flux logistiques.
          </p>
        </div>

        {/* Sélection du Médicament Traceur */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Médicament Traceur Suivi</span>
            {currentProduct.requiresColdChain && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
                <Snowflake className="h-3 w-3" /> 2°C - 8°C
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer pr-8"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.innName} ({p.strength}) {p.requiresColdChain ? '❄️' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Recherche Rapide */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher ville, commune, hôpital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filtres par Département */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Département</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tous (12 départ.)</option>
              {DEPARTMENTS_DATA.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Type d'Établissement</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="central_depot">Dépôt Central</option>
              <option value="referral_hospital">Hôpitaux de Réf.</option>
              <option value="health_center">Centres de Santé</option>
              <option value="pharmacy">Pharmacies</option>
            </select>
          </div>
        </div>

        {/* Filtre État de Couverture (Jours) */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1.5">État de Couverture en Stock</label>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'critical' ? 'all' : 'critical')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left cursor-pointer transition ${
                selectedStatus === 'critical'
                  ? 'bg-red-950/70 border-red-500 text-red-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <span>&lt; 7j (Critique)</span>
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'warning' ? 'all' : 'warning')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left cursor-pointer transition ${
                selectedStatus === 'warning'
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span>7 - 20j (Tension)</span>
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'balanced' ? 'all' : 'balanced')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left cursor-pointer transition ${
                selectedStatus === 'balanced'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>21 - 60j (Équilibré)</span>
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'surplus' ? 'all' : 'surplus')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left cursor-pointer transition ${
                selectedStatus === 'surplus'
                  ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              <span>&gt; 60j (Surplus)</span>
            </button>
          </div>
        </div>

        {/* Couches Thématiques Activables */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Couches & Réseaux Thématiques</span>
          </label>
          <div className="space-y-1.5 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => setShowRoutes(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Tournées de Livraison VRP</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showTransfers}
                onChange={(e) => setShowTransfers(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                <span>Transferts Inter-Sites Recommandés</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Réseau Routier National (RNIE)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showCities}
                onChange={(e) => setShowCities(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Villes & Agglomérations</span>
            </label>
          </div>
        </div>

        {/* Bouton Zoom Urbain Cotonou / Grand Nokoué */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={toggleUrbanZoom}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-2 cursor-pointer ${
              urbanZoomActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span>{urbanZoomActive ? 'Quitter Zoom Grand Nokoué' : 'Zoom Urbain : Cotonou & Calavi'}</span>
          </button>
        </div>

        {/* Légende Accessible (Couleur + Forme + Texte) */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <span className="font-semibold text-slate-300 block mb-1">Légende Typologie :</span>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-cyan-400" />
            <span>Dépôt Central Cotonou (Dépôt National)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rotate-45 bg-emerald-400" />
            <span>Hôpital de Référence Départemental</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-emerald-400" />
            <span>Centre de Santé Communal / Arrondissement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm border border-emerald-400" />
            <span>Pharmacie d'Officine Privée</span>
          </div>
        </div>
      </div>

      {/* Surface Cartographique Interactive SVG */}
      <div className="relative flex-1 bg-[#070b14] overflow-hidden flex items-center justify-center min-h-[500px]">
        
        {/* Commandes Flottantes de Zoom */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 shadow-lg backdrop-blur-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Zoomer"
            aria-label="Zoomer sur la carte"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Dézoomer"
            aria-label="Dézoomer de la carte"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Réinitialiser la vue nationale"
            aria-label="Réinitialiser la vue de la carte"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Badge d'indication contextuelle */}
        <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-sm text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">République du Bénin</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300 font-mono text-[11px]">{currentProduct.innName}</span>
        </div>

        {/* SVG de la Carte */}
        <svg
          viewBox="0 0 540 860"
          className="w-full h-full max-h-[820px] transition-transform duration-300 ease-out select-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Grille cartographique subtile */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.4" strokeOpacity="0.5" />
            </pattern>

            {/* Marqueur de flèche pour les tournées */}
            <marker id="arrow-route" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            {/* Marqueur de flèche pour les transferts */}
            <marker id="arrow-transfer" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Arrière-plan grille */}
          <rect width="540" height="860" fill="url(#grid)" />

          {/* Polygones des 12 Départements */}
          <g id="departments-layer">
            {DEPARTMENTS_DATA.map((dept) => {
              const isSelected = selectedDepartment === dept.name;
              const centerSvg = projectGeoToSvg(dept.labelCoord);

              return (
                <g key={dept.name} className="transition-all duration-200">
                  <path
                    d={dept.svgPath}
                    fill={isSelected ? '#1e293b' : '#0f172a'}
                    stroke={isSelected ? '#10b981' : '#334155'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="hover:fill-slate-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedDepartment(selectedDepartment === dept.name ? 'all' : dept.name)}
                  />
                  {/* Nom du département */}
                  <text
                    x={centerSvg.x}
                    y={centerSvg.y}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="0.08em"
                    className="pointer-events-none uppercase opacity-60"
                  >
                    {dept.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Réseau Routier National (RNIE) */}
          {showRoads && (
            <g id="roads-layer" opacity="0.6">
              {BENIN_ROAD_NETWORK.map((road) => {
                const pathPoints = road.waypoints.map((pt) => {
                  const p = projectGeoToSvg(pt);
                  return `${p.x},${p.y}`;
                });
                const dString = `M ${pathPoints.join(' L ')}`;

                return (
                  <path
                    key={road.code}
                    d={dString}
                    fill="none"
                    stroke={road.isPaved ? '#475569' : '#b45309'}
                    strokeWidth={road.type === 'backbone_highway' ? 2.5 : 1.5}
                    strokeDasharray={road.isPaved ? undefined : '3,3'}
                  />
                );
              })}
            </g>
          )}

          {/* Trajets des Tournées VRP (Overlay activable) */}
          {showRoutes && (
            <g id="vrp-routes-layer">
              {routes.map((route, rIdx) => {
                const colors = ['#38bdf8', '#34d399', '#a78bfa'];
                const routeColor = colors[rIdx % colors.length];

                // Départ depuis Cotonou
                const depotPt = projectGeoToSvg({ lat: 6.3685, lon: 2.435 });
                let currentPoint = depotPt;

                return (
                  <g key={route.id}>
                    {route.stops.map((stop, sIdx) => {
                      const stopPt = projectGeoToSvg(stop.coord);
                      const midX = (currentPoint.x + stopPt.x) / 2;
                      const midY = (currentPoint.y + stopPt.y) / 2;
                      const prevPt = currentPoint;
                      currentPoint = stopPt;

                      return (
                        <g key={stop.facilityId}>
                          {/* Segment de route VRP */}
                          <line
                            x1={prevPt.x}
                            y1={prevPt.y}
                            x2={stopPt.x}
                            y2={stopPt.y}
                            stroke={routeColor}
                            strokeWidth="2.2"
                            strokeDasharray="4,3"
                            markerEnd="url(#arrow-route)"
                            className="opacity-80"
                          />
                          {/* Numéro de stop */}
                          <circle cx={stopPt.x - 7} cy={stopPt.y - 7} r="6" fill="#0284c7" />
                          <text
                            x={stopPt.x - 7}
                            y={stopPt.y - 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {stop.stopOrder}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* Vecteurs de Transferts Inter-Sites (Overlay activable) */}
          {showTransfers && (
            <g id="transfers-layer">
              {transfers.slice(0, 12).map((tr) => {
                const fromFac = facilities.find((f) => f.id === tr.fromFacilityId);
                const toFac = facilities.find((f) => f.id === tr.toFacilityId);
                if (!fromFac || !toFac) return null;

                const p1 = projectGeoToSvg(fromFac.coord);
                const p2 = projectGeoToSvg(toFac.coord);

                return (
                  <g key={tr.id}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                      markerEnd="url(#arrow-transfer)"
                      className="opacity-90"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Villes et Agglomérations Principales */}
          {showCities && (
            <g id="cities-layer">
              {BENIN_CITIES.map((city) => {
                const p = projectGeoToSvg(city.coord);
                return (
                  <g key={city.id} className="pointer-events-none">
                    <circle cx={p.x} cy={p.y} r="2.5" fill="#e2e8f0" opacity="0.8" />
                    <text
                      x={p.x + 5}
                      y={p.y + 3}
                      fill="#cbd5e1"
                      fontSize={city.isUrbanHub ? '9.5' : '8'}
                      fontWeight={city.isUrbanHub ? 'bold' : 'normal'}
                      opacity={city.isUrbanHub ? '0.95' : '0.65'}
                    >
                      {city.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Quartiers de Cotonou & Abomey-Calavi si le Zoom Urbain est Actif */}
          {urbanZoomActive && (
            <g id="neighbourhoods-layer">
              {BENIN_CITIES.filter((c) => c.neighbourhoods).flatMap((city) =>
                city.neighbourhoods!.map((nh, nIdx) => {
                  const baseP = projectGeoToSvg(city.coord);
                  // Décalage pour visualiser la dispersion des quartiers
                  const offsetX = (nIdx % 3 - 1) * 18;
                  const offsetY = Math.floor(nIdx / 3) * 14 - 10;
                  return (
                    <g key={nh} className="pointer-events-none">
                      <rect
                        x={baseP.x + offsetX - 2}
                        y={baseP.y + offsetY - 6}
                        width={nh.length * 3.8 + 6}
                        height="10"
                        fill="#020617"
                        opacity="0.8"
                        rx="2"
                      />
                      <text
                        x={baseP.x + offsetX}
                        y={baseP.y + offsetY + 2}
                        fill="#38bdf8"
                        fontSize="6"
                        fontWeight="500"
                      >
                        {nh}
                      </text>
                    </g>
                  );
                })
              )}
            </g>
          )}

          {/* Marqueurs des Structures Sanitaires (54 structures) */}
          <g id="facilities-layer">
            {filteredFacilities.map((fac) => {
              const p = projectGeoToSvg(fac.coord);
              const visuals = getFacilityMarkerVisuals(fac);
              const isSelected = selectedFacility?.id === fac.id;
              const isHovered = hoveredFacility?.id === fac.id;

              return (
                <g
                  key={fac.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectFacility(fac)}
                  onMouseEnter={() => setHoveredFacility(fac)}
                  onMouseLeave={() => setHoveredFacility(null)}
                >
                  {/* Halo animé pour les structures en rupture critique (< 7j) */}
                  {visuals.doc < 7 && fac.type !== 'central_depot' && (
                    <circle r="9" fill="#ef4444" className="animate-ping-slow opacity-60" />
                  )}

                  {/* Marqueur selon la forme géométrique accessible */}
                  {fac.type === 'central_depot' ? (
                    // Dépôt Central : Étoile / Badge Céleste
                    <polygon
                      points="0,-8 5,6 -7,-3 7,-3 -5,6"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                  ) : fac.type === 'referral_hospital' ? (
                    // Hôpital de référence : Losange / Croix
                    <g>
                      <rect
                        x="-5.5"
                        y="-5.5"
                        width="11"
                        height="11"
                        transform="rotate(45)"
                        fill={visuals.color}
                        stroke={isSelected ? '#ffffff' : visuals.borderColor}
                        strokeWidth={isSelected ? '2.5' : '1.2'}
                      />
                      <path d="M -2 0 L 2 0 M 0 -2 L 0 2" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  ) : fac.type === 'health_center' ? (
                    // Centre de santé : Cercle
                    <circle
                      r="4.5"
                      fill={visuals.color}
                      stroke={isSelected ? '#ffffff' : visuals.borderColor}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                  ) : (
                    // Pharmacie : Carré
                    <rect
                      x="-3.5"
                      y="-3.5"
                      width="7"
                      height="7"
                      rx="1"
                      fill={visuals.color}
                      stroke={isSelected ? '#ffffff' : visuals.borderColor}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                  )}

                  {/* Étiquette au survol ou sélection */}
                  {(isSelected || isHovered) && (
                    <g transform="translate(10, -10)" className="pointer-events-none z-30">
                      <rect
                        x="0"
                        y="0"
                        width={fac.name.length * 5.5 + 20}
                        height="26"
                        rx="4"
                        fill="#090d16"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text x="8" y="12" fill="#ffffff" fontSize="9" fontWeight="bold">
                        {fac.name}
                      </text>
                      <text x="8" y="21" fill={visuals.color} fontSize="8">
                        {visuals.statusLabel}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Info-bulle flottante mobile / résumé au survol */}
        {hoveredFacility && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs z-30 bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs">
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span className="truncate pr-2">{hoveredFacility.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                Score {hoveredFacility.priorityScore}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2">
              <span>{hoveredFacility.city}</span>
              <span>·</span>
              <span>{hoveredFacility.department}</span>
              <span>·</span>
              <span>Pop. {hoveredFacility.servedPopulation.toLocaleString()} hab.</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
              <span className="text-slate-300 truncate">{currentProduct.innName} :</span>
              <span className="font-mono font-semibold text-white">
                {hoveredFacility.stocks.find((s) => s.productId === selectedProductId)?.daysOfCover ?? 0} jours de couv.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
