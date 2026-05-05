# Exploitation Analytique - Plateforme de Détection d'Anomalies

## Vue d'ensemble

Ce document décrit la stratégie d'exploitation analytique des données générées par la plateforme de détection d'anomalies financières. Nous fournissons trois niveaux d'accès aux données:

1. **API REST** - Accès programmatique aux analyses
2. **Export Raw Data** - Export des transactions brutes (JSON)
3. **Tableau de bord Metabase** - Visualisations interactives et explorations ad-hoc

---

## 1. Accès API Analytique

### Base URL
```
http://localhost:8001/api/analytics
```

### Routes disponibles

#### A. Analyse 1: Détection d'Anomalies et Fraude
```
GET /api/analytics/fraud-detection
```

**Objectif**: Identifier les patterns de fraude et les transactions suspectes

**Données retournées**:
- Taux global d'anomalies
- Distribution des anomalies par catégorie de transaction
- Distribution des anomalies par pays
- Série temporelle des anomalies

**Exemple d'utilisation**:
```bash
curl http://localhost:8001/api/analytics/fraud-detection | jq
```

**Cas d'usage**:
- Détection de pics d'activité frauduleuse
- Identification des catégories à risque (shopping, voyages, etc.)
- Analyse géographique des fraudes

---

#### B. Analyse 2: Comportement des Utilisateurs
```
GET /api/analytics/user-behavior
```

**Objectif**: Comprendre les patterns de comportement et segmenter les utilisateurs par profil de risque

**Données retournées**:
- Statistiques par utilisateur (montants, fréquence, totaux)
- Segmentation en 3 catégories de risque (Haut/Moyen/Bas)

**Exemple d'utilisation**:
```bash
curl http://localhost:8001/api/analytics/user-behavior | jq '.risk_segmentation'
```

**Cas d'usage**:
- Identifier les utilisateurs à haut risque
- Analyser les patterns d'achat moyens
- Détecter les changements comportementaux

---

#### C. Analyse 3: Modèle de Scoring de Risque
```
GET /api/analytics/risk-scoring
```

**Objectif**: Analyser les facteurs de risque et construire un modèle prédictif

**Données retournées**:
- Facteurs de risque par catégorie de transaction
- Facteurs de risque par pays
- Corrélation entre risque et anomalies

**Exemple d'utilisation**:
```bash
curl http://localhost:8001/api/analytics/risk-scoring | jq '.category_risk_factors'
```

**Cas d'usage**:
- Identifier les catégories à forte propension à la fraude
- Analyser l'impact géographique sur le risque
- Calibrer les seuils d'alerte

---

#### D. Analyse Supplémentaire: Alertes
```
GET /api/analytics/alerts-analysis
```

**Objectif**: Analyser l'efficacité du système d'alertes

**Données retournées**:
- Distribution des alertes par type et sévérité
- Taux de résolution
- Alertes non résolues

**Exemple d'utilisation**:
```bash
curl http://localhost:8001/api/analytics/alerts-analysis | jq '.resolution_status'
```

---

#### E. Export Raw Data
```
GET /api/analytics/transactions-export?limit=1000
```

**Objectif**: Exporter les transactions brutes pour analyse externe (Data Science, BI)

**Paramètres**:
- `limit` (optionnel): nombre de transactions à exporter (défaut: 1000)

**Exemple**:
```bash
curl http://localhost:8001/api/analytics/transactions-export?limit=5000 > transactions.json
```

**Format des données**:
```json
[
  {
    "id": "uuid",
    "user_id": "user_1",
    "amount": 150.50,
    "currency": "EUR",
    "merchant": "Amazon",
    "category": "Shopping",
    "country": "FR",
    "timestamp": "2026-05-04T10:30:00",
    "is_anomaly": false,
    "risk_score": 0.25,
    "status": "validated"
  }
]
```

---

### Stats Rapides
```
GET /api/analytics/stats
```

Vue d'ensemble rapide: total, anomalies, taux d'anomalies, score de risque moyen

---

## 2. Tableau de bord Metabase

### Accès

1. Ouvrir un navigateur et aller à: **http://localhost:3001**
2. Connexion initiale (création de compte admin)
3. Ajouter la base de données PostgreSQL

### Configuration de la Base de Données

**Connexion PostgreSQL**:
- Host: `postgres`
- Port: `5432`
- Database: `anomaly_db`
- Username: `admin`
- Password: `admin123`

### Tableaux de Bord Recommandés

#### Dashboard 1: Vue d'ensemble des fraudes
- Carte: Taux d'anomalies global
- Graphique temporel: Anomalies par jour
- Heatmap: Anomalies par catégorie × pays

#### Dashboard 2: Segmentation des utilisateurs
- Pie chart: Distribution par profil de risque
- Tableau: Top 20 utilisateurs par montant
- Histogramme: Distribution des montants moyens

#### Dashboard 3: Facteurs de risque
- Bar chart: Catégories par score de risque moyen
- Scatter plot: Montant vs Risk Score
- Table: Anomalies par région

#### Dashboard 4: Performance des alertes
- KPI: Taux de résolution des alertes
- Timeline: Alertes par sévérité
- Matrice: Types d'alertes × Sévérité

### Requêtes SQL Utiles

#### Fraudes par catégorie (30 jours)
```sql
SELECT 
  category,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as fraud_count,
  ROUND(100.0 * SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) / COUNT(*), 2) as fraud_rate,
  ROUND(AVG(amount), 2) as avg_amount,
  ROUND(AVG(risk_score), 3) as avg_risk_score
FROM transactions
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY category
ORDER BY fraud_count DESC;
```

#### Profils utilisateurs à haut risque
```sql
SELECT 
  user_id,
  COUNT(*) as transaction_count,
  ROUND(AVG(amount), 2) as avg_amount,
  ROUND(MAX(risk_score), 3) as max_risk_score,
  ROUND(AVG(risk_score), 3) as avg_risk_score,
  SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomaly_count
FROM transactions
GROUP BY user_id
HAVING AVG(risk_score) > 0.6
ORDER BY avg_risk_score DESC
LIMIT 20;
```

#### Anomalies par pays (derniers 7 jours)
```sql
SELECT 
  country,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomalies,
  ROUND(100.0 * SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) / COUNT(*), 2) as anomaly_rate,
  ROUND(AVG(risk_score), 3) as avg_risk_score
FROM transactions
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY country
ORDER BY anomalies DESC;
```

#### Timeline des alertes
```sql
SELECT 
  DATE(created_at) as alert_date,
  alert_type,
  severity,
  COUNT(*) as count,
  SUM(CASE WHEN resolved THEN 1 ELSE 0 END) as resolved_count
FROM alerts
GROUP BY DATE(created_at), alert_type, severity
ORDER BY alert_date DESC;
```

---

## 3. Accès Direct à PostgreSQL

### Connexion à la base de données

```bash
psql -h localhost -U admin -d anomaly_db
```

**Mot de passe**: `admin123`

### Tables principales

**transactions**
- id (UUID, PK)
- user_id
- amount
- currency
- merchant
- category
- country
- timestamp
- is_anomaly
- risk_score
- status

**alerts**
- id (UUID, PK)
- transaction_id (FK)
- alert_type
- severity
- message
- created_at
- resolved

---

## 4. Cas d'Usage Analytiques

### Use Case 1: Détection de Fraude Massive
**Requête**: Identifier les pics d'activité frauduleuse par heure
```sql
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as transactions,
  SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as frauds,
  ROUND(AVG(risk_score), 3) as avg_risk
FROM transactions
GROUP BY DATE_TRUNC('hour', timestamp)
HAVING SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) > 5
ORDER BY hour DESC;
```

### Use Case 2: Analyse de Segment Utilisateur
**API**: `/api/analytics/user-behavior` + filtrage en temps réel

Identifier les utilisateurs "voyageurs" (multiples pays) vs "locaux"

### Use Case 3: Prédiction de Risque Simple
**Modèle**: Score de risque = f(montant, pays, catégorie)

Utiliser l'API risk-scoring pour calibrer les seuils

### Use Case 4: Rapport de Conformité
Exporter les données via `/api/analytics/transactions-export` pour audit externe

---

## 5. Métriques Clés (KPIs)

| Métrique | Cible | Alerte |
|----------|-------|--------|
| Taux d'anomalies | < 5% | > 10% |
| Score de risque moyen | < 0.3 | > 0.5 |
| Taux de résolution d'alertes | > 95% | < 90% |
| Détection fraude/jour | < 10 | > 20 |
| Faux positifs | < 2% | > 5% |

---

## 6. Démarrage du Projet Analytique

### Étape 1: Lancer l'infrastructure
```bash
docker compose up -d postgres backend prometheus grafana metabase
```

### Étape 2: Initialiser les données
L'API backend génère automatiquement 200 transactions au démarrage

### Étape 3: Accéder aux dashboards
- **Metabase**: http://localhost:3001
- **Grafana**: http://localhost:3000
- **API Analytics**: http://localhost:8001/api/analytics/stats

### Étape 4: Créer des visualisations
1. Dans Metabase, créer des Questions (queries)
2. Regrouper les questions dans des Dashboards
3. Partager les dashboards avec l'équipe

---

## 7. Intégration avec Outils BI Externes

### Export vers Power BI
```bash
# Exporter les données en CSV
curl http://localhost:8001/api/analytics/transactions-export?limit=10000 \
  | jq -r '.[] | [.id, .user_id, .amount, .category, .country, .is_anomaly, .risk_score] | @csv' \
  > transactions.csv
```

### Export vers Python/Pandas
```python
import requests
import pandas as pd

# Récupérer les données
response = requests.get('http://localhost:8001/api/analytics/transactions-export?limit=5000')
data = response.json()

# Convertir en DataFrame
df = pd.DataFrame(data)

# Analyser
fraud_by_category = df[df['is_anomaly']].groupby('category').size()
print(fraud_by_category)
```

---

## 8. Maintenance

### Sauvegarde des données analytiques
```bash
# Backup de la base PostgreSQL
docker exec anomaly-postgres pg_dump -U admin anomaly_db > backup_$(date +%Y%m%d).sql
```

### Monitoring des performances
Consulter Prometheus (http://localhost:9090) pour les KPIs temps réel

### Archivage des données anciennes (optionnel)
```sql
-- Archiver les transactions de plus de 90 jours
DELETE FROM transactions 
WHERE timestamp < CURRENT_DATE - INTERVAL '90 days'
AND is_anomaly = FALSE;
```

---

**Créé le**: 04/05/2026  
**Version**: 1.0
