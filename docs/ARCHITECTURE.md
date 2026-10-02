# docs/ARCHITECTURE.md : Architecture Technique de la Plateforme PharmaBénin

## 1. Vue d'Ensemble des Flux

```
SOURCES EXTERNES (En ligne uniquement)
OpenStreetMap · geoBoundaries · WorldPop · CHIRPS / Open-Meteo · OMS LNME
       │
       ▼
GÉNÉRATEUR DE DONNÉES SIMULÉES (data/simulator/generator.py)
       │──► Fichiers Parquet / CSV (data/processed/)
       ▼
GOOGLE COLAB (Entraînement hors-ligne, validation glissante)
       │──► Modèle sérialisé (ml/models/demand_lightgbm_v1.joblib)
       ▼
GITHUB ACTIONS (Calcul batch automatisé ou manuel workflow_dispatch)
       │──► Exécution de ml/run_pipeline.py
       │──► Écriture avec clé secrète service_role dans SUPABASE POSTGRESQL
                                                │
                                                ▼ (Lecture publique via RLS)
VERCEL (Frontend React / Next.js / Vite SPA)
       ├── Carte Vectorielle Interactive du Bénin
       ├── Laboratoire Prévisionnel Quantile [q10, q50, q90]
       ├── Moteur de Transferts Horizontaux (PLNE)
       ├── Flotte VRP depuis le Dépôt Central de Cotonou
       └── Simulateur de Résilience "Et Si ?" (Monte Carlo)
```

## 2. Principes Directeurs
1. **Entraînement décorrélé de la production** : Aucun modèle d'apprentissage lourd ne tourne sur Vercel. Tout calcul prédictif est réalisé par GitHub Actions ou Google Colab et persisté dans Supabase.
2. **Atomicité des résultats par `run_id`** : L'interface utilisateur interroge uniquement le `current_run_id`. Tout pipeline interrompu ne produit jamais d'affichage corrompu.
3. **Traçabilité totale** : Tout champ généré par simulation porte le champ `is_simulated = True`.
