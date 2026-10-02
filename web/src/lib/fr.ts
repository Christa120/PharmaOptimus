/**
 * Dictionnaire complet des chaînes UI en français.
 * Toutes les chaînes de l'interface passent par ce fichier — aucun texte brut
 * éparpillé dans les composants.
 */
export const fr = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    problem: 'Le problème',
    solution: 'La solution',
    howItWorks: 'Fonctionnement',
    map: 'Carte',
    dataMethod: 'Données et méthode',
    openDemo: 'Ouvrir la démonstration',
    appName: 'PharmaOptimus',
  },

  // ── Statuts de stock ────────────────────────────────────────────────────────
  status: {
    criticalStockout: 'Rupture critique',
    stockoutRisk: 'Risque rupture',
    expiryRisk: 'Risque péremption',
    excessStock: 'Stock excessif',
    normal: 'Normal',
  },

  // ── Messages d'erreur ───────────────────────────────────────────────────────
  errors: {
    loadFailed: 'Erreur de chargement des données',
    supabaseRequired: 'Connexion Supabase requise',
    sessionExpired: 'Session expirée',
    unknownError: 'Une erreur inattendue est survenue',
    metricsUnavailable:
      'Métriques non disponibles — exécuter ml/train_and_export_model.py puis ml/run_pipeline.py',
  },

  // ── États vides ──────────────────────────────────────────────────────────────
  empty: {
    noAlerts: 'Aucune alerte active',
    noRecommendations: 'Aucune recommandation en attente',
    noRoutes: 'Aucune tournée planifiée',
    noData: 'Aucune donnée disponible',
  },

  // ── Labels tableau de bord ───────────────────────────────────────────────────
  dashboard: {
    criticalFacilities: 'Établissements critiques',
    predictedStockouts14d: 'Ruptures prévues à 14j',
    expiryValueAtRisk: 'Valeur à risque péremption',
    pendingRecommendations: 'Recommandations en attente',
    unservedFacilities: 'Établissements non servis',
    lastRun: 'Dernier calcul',
    modelVersion: 'Version modèle',
    runId: 'Identifiant calcul',
  },

  // ── Mentions légales / avertissements ────────────────────────────────────────
  disclaimers: {
    simulatedData: 'Démonstration sur données simulées',
    notValidated: 'Non validé sur données réelles',
    trainedOnSimulated: 'Entraîné sur données simulées uniquement',
    mockBanner: 'DONNÉES DE MAQUETTE — NE PAS UTILISER EN PRODUCTION',
    modelDisclaimer:
      "Ce modèle a été entraîné et évalué sur des données simulées uniquement. Il n'a pas été validé sur des données réelles de dispensation.",
    conflictingStatus:
      "Le statut 'validated_on_simulated_data' signifie : validé uniquement en environnement simulé, non validé sur données réelles.",
  },

  // ── Pages publiques ──────────────────────────────────────────────────────────
  hero: {
    headline: 'Chaque médicament au bon endroit, avant la rupture.',
    subheadline:
      "Une plateforme qui prévoit les besoins, repère les risques de rupture et de péremption, et planifie les livraisons du dépôt central jusqu'aux centres de santé du Bénin.",
    ctaDemo: 'Ouvrir la démonstration',
    ctaMethod: 'Voir la méthode',
  },

  problem: {
    title: 'Le problème',
    items: [
      {
        title: 'Données incomplètes',
        description:
          "Les stocks sont relevés manuellement, de façon irrégulière. Les ruptures ne sont souvent détectées qu'après coup.",
      },
      {
        title: 'Décisions tardives',
        description:
          "Sans anticipation, les réapprovisionnements arrivent trop tard. Les patients subissent des interruptions de traitement évitables.",
      },
      {
        title: 'Circuits peu coordonnés',
        description:
          "Le dépôt central, les districts et les centres de santé manquent d'une vue commune. Les transferts entre établissements restent rares et informels.",
      },
    ],
  },

  solution: {
    title: 'La solution',
    capabilities: [
      {
        title: 'Prévision de la demande',
        description:
          'Modèle ML qui anticipe les besoins semaine par semaine pour chaque produit et chaque établissement.',
      },
      {
        title: 'Détection des risques',
        description:
          'Score de priorité calculé automatiquement — rupture imminente, stock excessif, péremption proche.',
      },
      {
        title: 'Optimisation des transferts',
        description:
          'Suggestions de redistribution entre établissements pour équilibrer les stocks avant livraison.',
      },
      {
        title: 'Planification des tournées',
        description:
          'Itinéraires de livraison optimisés depuis le dépôt central vers les centres de santé.',
      },
    ],
  },

  howItWorks: {
    title: 'Fonctionnement',
    steps: [
      {
        number: '1',
        title: 'Collecte hebdomadaire',
        description: 'Les données de stock sont remontées chaque semaine depuis les établissements.',
      },
      {
        number: '2',
        title: 'Prévision ML',
        description: 'Le modèle calcule les prévisions et les scores de risque pour les 4 semaines suivantes.',
      },
      {
        number: '3',
        title: 'Recommandations',
        description: "Le système propose des transferts et des tournées. Rien n'est exécuté automatiquement.",
      },
      {
        number: '4',
        title: "Décision humaine",
        description:
          "Le pharmacien du dépôt valide, ajuste ou refuse chaque recommandation. L'humain décide.",
      },
    ],
  },

  forWho: {
    title: 'Pour qui',
    profiles: [
      {
        title: 'Pharmacien du dépôt central',
        description:
          'Visualise les risques de rupture, valide les transferts et planifie les tournées de livraison.',
      },
      {
        title: 'Responsable district de santé',
        description:
          'Suit les stocks des établissements de son district et reçoit des alertes en temps réel.',
      },
      {
        title: 'Ministre / Directeur DPM',
        description:
          'Accède aux indicateurs agrégés nationaux pour piloter la politique de médicaments essentiels.',
      },
    ],
  },

  dataMethod: {
    title: 'Données et méthode',
    sourceTableHeaders: ['Source', 'Statut', 'Notes'],
    statusLabels: {
      real: 'Réel',
      calibrated: 'Calibré',
      simulated: 'Simulé',
    },
    sources: [
      { name: 'geoBoundaries (ADM1/ADM2)', status: 'real', notes: 'Polygones départements et communes du Bénin' },
      { name: 'Open-Meteo', status: 'real', notes: 'Historique climatique 2020–2024' },
      { name: 'OSM — établissements de santé', status: 'real', notes: 'Points géographiques validés' },
      { name: 'OMS — médicaments essentiels', status: 'real', notes: 'Liste nationale 2023' },
      { name: 'Consommations hebdomadaires', status: 'simulated', notes: 'Simulées avec saisonnalité, chocs, censure' },
      { name: 'Stocks initiaux', status: 'simulated', notes: 'Générés par le simulateur reproductible' },
    ],
  },

  // ── Alertes ──────────────────────────────────────────────────────────────────
  alerts: {
    title: 'Alertes',
    acknowledge: 'Accusé de réception',
    filterBySeverity: 'Filtrer par gravité',
    filterByProduct: 'Filtrer par produit',
    filterByDepartment: 'Filtrer par département',
    severities: {
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Modérée',
      low: 'Faible',
    },
    types: {
      stockout: 'Rupture de stock',
      expiry: 'Péremption proche',
      overstock: 'Surstock',
      cold_chain: 'Rupture chaîne du froid',
    },
  },

  // ── Recommandations ──────────────────────────────────────────────────────────
  recommendations: {
    title: 'Recommandations de transfert',
    accept: 'Accepter',
    reject: 'Refuser',
    rejectionReasonPlaceholder: 'Motif du refus (obligatoire)',
    rejectionReasonRequired: 'Un motif est obligatoire pour refuser une recommandation.',
    statuses: {
      pending: 'En attente',
      accepted: 'Acceptée',
      rejected: 'Refusée',
    },
  },

  // ── Tournées ─────────────────────────────────────────────────────────────────
  routes: {
    title: 'Tournées de livraison',
    vehicle: 'Véhicule',
    stops: 'Arrêts',
    distance: 'Distance',
    duration: 'Durée estimée',
    unserved: 'Établissements non servis',
    stopOrder: 'Ordre',
    arrivalTime: "Heure d'arrivée",
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    attributions: 'Attributions',
    attributionList: [
      'Limites administratives : geoBoundaries (CC BY 4.0)',
      'Données climatiques : Open-Meteo (CC BY 4.0)',
      'Fonds de carte : OpenStreetMap contributors (ODbL)',
      'Liste médicaments : OMS / DPM Bénin',
    ],
    openSource: 'Code source disponible sous licence MIT',
  },
} as const
