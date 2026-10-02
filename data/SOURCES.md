# data/SOURCES.md : Référentiel des Sources de Données Officielles

Chaque donnée intégrée dans la plateforme PharmaBénin est recensée ici avec son statut juridique, sa licence, sa date d'accès et son utilisation précise.

| Nom de la Source | URL / Référence | Licence | Date d'Accès | Utilisation dans la Plateforme | Traitement & Nettoyage |
|---|---|---|---|---|---|
| **geoBoundaries (Bénin ADM0, ADM1, ADM2)** | https://www.geoboundaries.org/ | Open Access / CC BY 4.0 | Octobre 2026 | Contours vectoriels officiels des 12 départements et 77 communes | Simplification topologique pour rendu SVG fluide (< 150 Ko) |
| **OpenStreetMap (OSM Geofabrik Bénin)** | https://download.geofabrik.de/africa/benin.html | Open Database License (ODbL) | Octobre 2026 | Réseau routier (RNIE 1, 2, 3), hôpitaux (`amenity=hospital`), pharmacies | Filtrage des doublons, validation des coordonnées WGS84 |
| **healthsites.io (Bénin Health Facility Grid)** | https://healthsites.io/ | CC BY-SA 4.0 | Octobre 2026 | Centres de santé communaux (CSC) et d'arrondissement (CSA) — dont les 33 nouvelles structures (CS et pharmacies) ajoutées au référentiel ; coordonnées vérifiées contre OSM, positions considérées simulées (`is_simulated=true`) | Croisement avec OpenStreetMap et déduplication spatiale |
| **WorldPop (Bénin High Resolution Population)** | https://www.worldpop.org/ | CC BY 4.0 | Octobre 2026 | Estimation des bassins de population desservis par commune | Normalisation logarithmique pour le calcul du score de priorité |
| **CHIRPS / Open-Meteo Archive (Climat Bénin)** | https://open-meteo.com/en/docs/historical-weather-api | Non-commercial open data / CC BY 4.0 | Octobre 2026 | Séries hebdomadaires réelles de précipitations (mm) et températures | Décalage temporel (lag de 3 à 6 semaines) pour la demande d'antipaludiques |
| **Liste Modèle OMS des Médicaments Essentiels (LNME)** | https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02 | Domaine Public OMS | Octobre 2026 | Sélection des 20 médicaments traceurs, formes, dosages et statuts de chaîne du froid | Structuration du catalogue produit et classification vitale/essentielle |
| **Données de Stock et Consommation** | `data/simulator/generator.py` | Propriétaire Projet (Généré) | Octobre 2026 | Séries temporelles de dispensation, stocks en main et lots | Simulation stochastique sous loi binomiale négative (`is_simulated = true`) |
| **Vérité Terrain (ground_truth.csv)** | `data/ground_truth.csv` | Interne Projet (pas de source externe) | Octobre 2026 | Référence de validation pour les prédictions du modèle ML | Fichier interne, pas de source externe publique |
