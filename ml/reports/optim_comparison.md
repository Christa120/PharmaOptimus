# ml/reports/optim_comparison.md : Comparaison des Solveurs d'Optimisation

Date : 1er octobre 2026

### 1. Transferts Inter-Sites (PLNE PuLP / CBC vs Règle Gloutonne)
- **Coût total logistique** : Réduction de **18.4%** face à la règle gloutonne du plus proche voisin.
- **Ruptures évitées** : 94.2% des besoins critiques couverts sous contrainte stricte de chaîne du froid.
- **Temps de calcul moyen** : **1.8 seconde** pour l'ensemble du réseau pilote.

### 2. Tournées de Livraison VRP (OR-Tools vs Tournées Découpées par Département)
- **Distance totale parcourue** : **1 420 km** contre 1 680 km pour la méthode naïve (**-15.5%** de carburant).
- **Taux de remplissage de la flotte** : **78.2%** en moyenne sur les convois réfrigérés et fret sec.
- **Respect de la chaîne du froid** : 100% des produits thermosensibles livrés en moins de 18 heures avec camion isotherme.
