# COLAB.md — Guide d'exécution sur Google Colab

Ce guide détaille pas-à-pas la procédure pour exécuter l'exploration, l'entraînement des modèles de prévision LightGBM et l'évaluation finale dans l'environnement gratuit de Google Colab.

---

## Tableau "Que mettre où"

| Tâche | Environnement recommandé | Pourquoi |
|---|---|---|
| Exploration des données (notebooks 01–03) | Google Colab | Accès rapide, pas de setup local requis |
| Entraînement LightGBM (notebooks 04–05) | Google Colab (GPU T4 optionnel) | CPU gratuit suffit pour LightGBM |
| Évaluation et calibration (notebooks 06–08) | Google Colab | Même environnement que l'entraînement |
| Pipeline batch hebdomadaire | GitHub Actions | Automatisation, accès aux secrets Supabase |
| Déploiement frontend | Vercel | Hébergement Next.js, déploiement continu |
| Base de données | Supabase | PostgreSQL managé, API REST intégrée |

---

## 1. Ouvrir le dépôt dans Colab

**Pour un dépôt public** :
1. Aller sur https://colab.research.google.com.
2. Cliquer **Fichier → Ouvrir un notebook → GitHub**.
3. Coller l'URL du dépôt (ex. `https://github.com/<VOTRE_COMPTE>/PharmaOptimus`).
4. Choisir le notebook à ouvrir.

**Pour un dépôt privé** :
1. Créer un Personal Access Token (PAT) sur GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → accès `read` sur le dépôt.
2. Stocker le token dans les **Secrets Colab** :
   - Colab → icône 🔑 (clé) dans le panneau de gauche → **Ajouter un nouveau secret**.
   - Nom : `GITHUB_TOKEN` — Valeur : votre PAT.
3. **Ne jamais coller le token dans une cellule de notebook** — il serait visible dans l'historique Git.
4. Accéder au token dans le notebook :
```python
from google.colab import userdata
token = userdata.get('GITHUB_TOKEN')
```

---

## 2. Monter Google Drive

Monter Drive dès le début pour persister les fichiers générés entre les sessions :

```python
from google.colab import drive
drive.mount('/content/drive')
```

**Résultat attendu** : `Mounted at /content/drive`. Les fichiers dans `/content/drive/MyDrive/` survivent aux déconnexions Colab.

---

## 3. Cloner le dépôt et installer les dépendances

```bash
# Cloner depuis GitHub (dépôt public)
!git clone https://github.com/<VOTRE_COMPTE>/PharmaOptimus.git
%cd PharmaOptimus

# Installer les dépendances de recherche
!pip install -r ml/requirements-colab.txt
```

**Résultat attendu** : installation sans erreur, toutes les librairies disponibles (LightGBM, OR-Tools, PuLP, statsforecast, etc.).

---

## 4. Première cellule obligatoire — Fixer la graine et afficher les versions

Cette cellule doit être la **première** exécutée dans tout notebook d'entraînement pour garantir la reproductibilité :

```python
import random
import numpy as np
import lightgbm as lgb
import pandas as pd

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

print(f"LightGBM {lgb.__version__} | pandas {pd.__version__} | numpy {np.__version__}")
```

**Résultat attendu** : affichage des versions sans erreur. Les versions de référence sont LightGBM ≥ 4.3.0, pandas ≥ 2.2.0, numpy ≥ 1.26.0.

---

## 5. Générer les données simulées

```bash
!python data/simulator/build_datasets.py
```

**Résultat attendu** :
- `data/geo/reseau_pilote_benin.csv` — 54 établissements
- `data/processed/historical_consumption_benin.csv` — ~151 200 lignes (140 sem × 54 fac × 20 produits)
- `data/processed/ground_truth.csv` — demande latente non censurée
- `data/processed/weather_chirps_benin.csv` — séries climatiques
- `ml/reports/data_quality.md` — rapport de contrôle qualité

**Temps estimé** : 1–3 minutes selon la puissance du runtime Colab.

---

## 6. Exécuter les notebooks dans l'ordre

Exécuter les notebooks de bout en bout, sans erreur, dans cet ordre :

| Notebook | Contenu |
|---|---|
| `ml/notebooks/01_exploration.ipynb` | Exploration des données brutes |
| `ml/notebooks/02_saisonnalite.ipynb` | Analyse de saisonnalité |
| `ml/notebooks/03_baselines.ipynb` | Modèles de référence (naïf, moyenne mobile) |
| `ml/notebooks/04_modeles.ipynb` | Entraînement LightGBM |
| `ml/notebooks/05_intervalles.ipynb` | Intervalles de prédiction (CQR) |
| `ml/notebooks/06_risques.ipynb` | Calcul des scores de risque |
| `ml/notebooks/07_anomalies_priorite.ipynb` | Détection d'anomalies et score de priorité |
| `ml/notebooks/08_evaluation_finale.ipynb` | Évaluation finale et rapport |

**Règle** : chaque notebook doit s'exécuter sans erreur avant de passer au suivant.

---

## 7. Entraîner et exporter le modèle

```bash
!python ml/train_and_export_model.py
```

**Résultat attendu** :
- `ml/models/demand_lightgbm_v1.joblib` — modèle sérialisé (> 10 000 octets)
- `ml/models/demand_v1_metadata.json` — métadonnées du modèle

**Temps estimé** : 5–15 minutes selon le runtime.

---

## 8. Vérifier le modèle

```bash
!python ml/scripts/verify_model.py
```

**Résultat attendu** : affichage de `CONTRÔLE RÉUSSI — modèle réel chargé.`

Si le contrôle échoue, relire le message d'erreur et relancer l'étape 7.

---

## 9. Calculer les métriques d'évaluation

```bash
!python ml/evaluate.py --split test --out ml/reports/metrics.json
```

**Résultat attendu** : fichier `ml/reports/metrics.json` créé avec les métriques WAPE, MASE, RMSSE, biais et couverture des intervalles.

---

## 10. Télécharger et pousser les artefacts

Après un entraînement réussi, sauvegarder les fichiers importants :

**Option A — Télécharger dans le navigateur** :
```python
from google.colab import files
files.download('ml/models/demand_lightgbm_v1.joblib')
files.download('ml/models/demand_v1_metadata.json')
files.download('ml/reports/metrics.json')
```

**Option B — Pousser directement sur GitHub** :
```bash
!git config user.email "<VOTRE_EMAIL>"
!git config user.name "<VOTRE_NOM>"
!git add ml/models/demand_lightgbm_v1.joblib
!git add ml/models/demand_v1_metadata.json
!git add ml/reports/metrics.json
!git commit -m "feat: modèle LightGBM entraîné sur Colab"
!git push
```

**Option C — Sauvegarder sur Drive d'abord** :
```python
import shutil
shutil.copy('ml/models/demand_lightgbm_v1.joblib',
            '/content/drive/MyDrive/pharmaoptimus/demand_lightgbm_v1.joblib')
```

---

## Si Colab se déconnecte

Colab déconnecte les sessions inactives après ~90 minutes (Colab gratuit) ou après une longue exécution.

- **Les fichiers dans `/content/drive/MyDrive/`** : sauvegardés, non perdus.
- **Les fichiers dans `/content/`** (dépôt cloné, fichiers générés) : **perdus** → recloner le dépôt et regénérer.
- **Le modèle joblib** : non perdu **s'il a été copié sur Drive** avant la déconnexion.

**Solution** : après chaque étape longue, copier les artefacts importants sur Drive :

```python
import shutil, os
drive_dir = '/content/drive/MyDrive/pharmaoptimus/'
os.makedirs(drive_dir, exist_ok=True)

# Sauvegarder après build_datasets.py
shutil.copytree('data/processed', drive_dir + 'processed', dirs_exist_ok=True)

# Sauvegarder après train_and_export_model.py
shutil.copy('ml/models/demand_lightgbm_v1.joblib', drive_dir)
shutil.copy('ml/models/demand_v1_metadata.json', drive_dir)

# Sauvegarder après evaluate.py
shutil.copy('ml/reports/metrics.json', drive_dir)
```

---

## Ce qu'il faut sauvegarder avant de fermer

| Fichier | Destination | Méthode |
|---|---|---|
| `ml/models/demand_lightgbm_v1.joblib` | Drive **puis** GitHub | `shutil.copy` puis `git push` |
| `ml/models/demand_v1_metadata.json` | GitHub | `git push` |
| `ml/reports/metrics.json` | GitHub | `git push` |
| Notebooks avec sorties (`.ipynb`) | GitHub | `git add ml/notebooks/*.ipynb && git push` |

> **Important** : les notebooks `.ipynb` avec leurs sorties (graphiques, métriques) sont la preuve que le modèle a bien été entraîné. Les pousser sur GitHub avec les sorties intactes.

---

## Environnement d'exécution recommandé

- **Type de runtime** : CPU standard (gratuit) — suffisant pour LightGBM.
- **GPU T4** : optionnel, utile uniquement si vous testez des modèles deep learning.
- **RAM** : le runtime standard (≈12 Go) est suffisant pour 151 200 lignes × 20 features.

Pour changer le runtime : **Runtime → Changer le type d'exécution → CPU / T4 GPU**.
