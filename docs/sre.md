# SRE - Service Reliability Engineering

## Objectifs de Fiabilité (SLOs)

### API Backend
- **Disponibilité** : 99.5%
- **Temps de réponse (P95)** : 500ms
- **Taux d'erreurs** : < 0.1%

**Error Budget (disponibilité)** :
- 99.5% = 21.6 minutes de panne autorisée par mois
- 99.5% = 3.6 heures de panne autorisée par an

### Frontend
- **Disponibilité** : 99%
- **Temps de réponse (P95)** : 1000ms

**Error Budget (disponibilité)** :
- 99% = 7.2 heures de panne autorisée par mois
- 99% = 43.2 minutes de panne autorisée par jour

### Base de données
- **Disponibilité** : 99.9%
- **Latence de requête (P95)** : 100ms

---

## Indicateurs de Fiabilité (SLIs)

Les SLIs sont les métriques qu'on utilise pour mesurer si on atteint les SLOs.

### 1. Disponibilité (Uptime)
```
SLI = (Total requests - Failed requests) / Total requests × 100%
```
- Mesuré par Prometheus
- Alerte si < 99.5% sur les 5 dernières minutes

### 2. Latence (Response Time)
```
SLI = requests with latency < 500ms / total requests × 100%
```
- P95 = 95% des requêtes répondent en moins de 500ms
- Alerte si P95 > 500ms

### 3. Taux d'erreurs
```
SLI = (HTTP 5xx errors / total requests) × 100%
```
- Alerte si > 0.1%

---

## Budget d'Erreurs (Error Budget)

Le budget d'erreurs = combien de défaillances on peut se permettre avant de casser le SLO.

### Exemple pour l'API (99.5% SLO)
- **Par mois (30 jours)** :
  - Durée totale = 30 × 24 × 60 = 43,200 minutes
  - Budget = 43,200 × 0.5% = 216 minutes = 3.6 heures
  
- **Par jour** :
  - Durée totale = 24 × 60 = 1,440 minutes
  - Budget = 1,440 × 0.5% = 7.2 minutes

### Burn Rate (taux de consommation)
- Burn Rate Normal = 1.0x (on consume le budget uniformément)
- Burn Rate Élevé = 2.0x+ (on brûle le budget 2x plus vite)
- **Alerte critique** : Burn Rate > 5% du budget mensuel sur 5 minutes

---

## Règles d'Alerte

| Alerte | Seuil | Action |
|--------|-------|--------|
| High Error Rate | > 0.5% errors | Page l'équipe |
| High Latency | P95 > 1000ms | Investigate |
| Low Uptime | < 99% over 1h | Page l'équipe |
| Error Budget Critical | < 10% remaining | Incident review |
| Error Budget Low | < 30% remaining | Warn team |

---

## Processus SRE

### 1. Monitoring Continu
- Prometheus scrape les métriques toutes les 15 secondes
- Grafana affiche le statut en temps réel
- Alertes automatiques via Prometheus AlertManager

### 2. Incident Response
1. Alerte reçue
2. Triage (sévérité ?)
3. Investigation rapide
4. Correction
5. Post-mortem

### 3. Error Budget Review
- Chaque semaine : vérifier la consommation du budget
- Si budget < 30% : réduire les déploiements risqués
- Si budget épuisé : focus sur la stabilité, pas de nouvelles features

---

## Métriques à Tracker

### Backend API (Prometheus)
```
up{job="backend"}                           # Disponibilité du service
http_requests_total                         # Total des requêtes
http_request_duration_seconds               # Latence par endpoint
http_requests_total{status=~"5.."}          # Erreurs serveur
```

### Base de données (PostgreSQL)
```
pg_up                                       # Est-ce que la DB est up ?
pg_stat_statements_mean_time                # Latence moyenne des queries
```

### Tous services
```
container_up                                # Container Docker est up
container_memory_usage_bytes                # Usage mémoire
container_cpu_usage_seconds_total           # Usage CPU
```

---

## Dashboard Grafana

Le dashboard SRE affiche :
- ✅ Statut global (Available / Degraded / Down)
- 📊 Uptime % pour chaque service (API, Frontend, DB)
- 📈 Burn rate du budget d'erreurs
- ⏱️ P95 latency trend
- 🚨 Incidents actifs
- 📋 Historique du budget (7 derniers jours)

---
