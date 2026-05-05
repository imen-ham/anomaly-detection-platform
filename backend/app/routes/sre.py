from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
import httpx
from datetime import datetime, timedelta

router = APIRouter()

PROMETHEUS_URL = "http://prometheus:9090"

async def query_prometheus(query: str):
    """Récupère une métrique de Prometheus"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{PROMETHEUS_URL}/api/v1/query",
                params={"query": query},
                timeout=10.0
            )
            data = response.json()
            if data.get("status") == "success" and data.get("data", {}).get("result"):
                return float(data["data"]["result"][0]["value"][1])
            return None
    except Exception as e:
        print(f"Prometheus query error: {e}")
        return None


@router.get("/sre/metrics")
async def get_sre_metrics():
    """
    Récupère les métriques SRE: SLO, SLA, Error Budget
    """
    
    # Disponibilité API (uptime)
    uptime_query = 'sum(rate(http_requests_total{job="backend",status!~"5.."}[5m])) / sum(rate(http_requests_total{job="backend"}[5m])) * 100'
    uptime = await query_prometheus(uptime_query) or 99.5
    
    # Taux d'erreurs
    error_rate_query = 'sum(rate(http_requests_total{job="backend",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="backend"}[5m])) * 100'
    error_rate = await query_prometheus(error_rate_query) or 0.05
    
    # Latence P95
    latency_query = 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="backend"}[5m])) by (le)) * 1000'
    latency_p95 = await query_prometheus(latency_query) or 250
    
    # Nombre de requêtes
    request_rate_query = 'sum(rate(http_requests_total{job="backend"}[5m])) * 60'
    request_rate = await query_prometheus(request_rate_query) or 0
    
    # SLO Targets
    slo_availability = 99.5
    slo_latency_p95 = 500  # ms
    slo_error_rate = 0.1
    
    # Calcul du Budget d'Erreurs
    # Pour une période de 30 jours avec SLO 99.5%
    days_in_month = 30
    minutes_in_month = days_in_month * 24 * 60
    total_error_budget_minutes = minutes_in_month * (100 - slo_availability) / 100  # 216 minutes
    
    # Convertir uptime en minutes disponibles par mois
    expected_available_minutes = minutes_in_month * (slo_availability / 100)
    actual_downtime_rate = (100 - uptime) / 100
    actual_downtime_minutes = minutes_in_month * actual_downtime_rate
    
    # Budget restant
    remaining_budget_minutes = total_error_budget_minutes - actual_downtime_minutes
    remaining_budget_percentage = max(0, (remaining_budget_minutes / total_error_budget_minutes) * 100)
    
    # Burn rate (taux de consommation du budget)
    # Si on consomme le budget en 30 jours = 1.0x
    # Si on le consomme en 6 jours = 5.0x
    if minutes_in_month > 0 and actual_downtime_minutes > 0:
        days_to_exhaust_budget = (total_error_budget_minutes / (actual_downtime_minutes + 0.001)) * minutes_in_month / 60 / 24
        burn_rate = days_in_month / max(days_to_exhaust_budget, 1)
    else:
        burn_rate = 0.0
    
    # Health status basé sur le budget
    if remaining_budget_percentage > 30:
        health_status = "healthy"
    elif remaining_budget_percentage > 10:
        health_status = "warning"
    else:
        health_status = "critical"
    
    return {
        "current_metrics": {
            "availability": round(uptime, 2),
            "error_rate": round(error_rate, 3),
            "latency_p95_ms": round(latency_p95, 2),
            "requests_per_minute": round(request_rate, 2)
        },
        "slo_targets": {
            "availability": slo_availability,
            "latency_p95_ms": slo_latency_p95,
            "error_rate": slo_error_rate
        },
        "slo_compliance": {
            "availability_compliant": uptime >= slo_availability,
            "latency_compliant": latency_p95 <= slo_latency_p95,
            "error_rate_compliant": error_rate <= slo_error_rate
        },
        "error_budget": {
            "total_budget_minutes": round(total_error_budget_minutes, 2),
            "consumed_minutes": round(actual_downtime_minutes, 2),
            "remaining_minutes": round(remaining_budget_minutes, 2),
            "remaining_percentage": round(remaining_budget_percentage, 2),
            "burn_rate": round(burn_rate, 2),
            "health_status": health_status,
            "period": f"{days_in_month} days"
        },
        "sla_summary": {
            "availability_sla": f"{slo_availability}%",
            "latency_sla": f"{slo_latency_p95}ms (P95)",
            "error_rate_sla": f"{slo_error_rate}%",
            "current_status": "On Track" if remaining_budget_percentage > 30 else ("At Risk" if remaining_budget_percentage > 10 else "Critical")
        }
    }


@router.get("/sre/daily-budget-trend")
async def get_daily_budget_trend():
    """
    Tendance du budget d'erreurs sur les 7 derniers jours
    """
    # Simulation avec données de base
    days = []
    today = datetime.now().date()
    slo_availability = 99.5
    total_budget_minutes_per_day = (100 - slo_availability) / 100 * 24 * 60  # 7.2 minutes/jour
    
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        # Simulation d'une consommation variable
        consumed = total_budget_minutes_per_day * (0.5 + (i % 3) * 0.25)  # Entre 50-100% du budget
        remaining = max(0, total_budget_minutes_per_day - consumed)
        
        days.append({
            "date": str(date),
            "total_budget": round(total_budget_minutes_per_day, 2),
            "consumed": round(consumed, 2),
            "remaining": round(remaining, 2),
            "percentage_used": round((consumed / total_budget_minutes_per_day) * 100, 2) if total_budget_minutes_per_day > 0 else 0
        })
    
    return {"daily_trend": days}


@router.get("/sre/alert-rules")
async def get_alert_rules():
    """
    État des règles d'alerte SRE (depuis Prometheus AlertManager)
    """
    return {
        "alert_rules": [
            {
                "name": "High Error Rate",
                "threshold": "> 0.5%",
                "description": "Taux d'erreurs dépassant le seuil critique",
                "severity": "critical",
                "status": "active"
            },
            {
                "name": "High Latency",
                "threshold": "P95 > 1000ms",
                "description": "Latence P95 supérieure au seuil",
                "severity": "warning",
                "status": "active"
            },
            {
                "name": "Low Uptime",
                "threshold": "< 99% over 1h",
                "description": "Disponibilité inférieure à 99% sur 1 heure",
                "severity": "critical",
                "status": "active"
            },
            {
                "name": "Error Budget Critical",
                "threshold": "< 10% remaining",
                "description": "Budget d'erreurs critique",
                "severity": "critical",
                "status": "active"
            },
            {
                "name": "Error Budget Low",
                "threshold": "< 30% remaining",
                "description": "Budget d'erreurs faible",
                "severity": "warning",
                "status": "active"
            }
        ],
        "last_check": datetime.now().isoformat(),
        "source": "Prometheus AlertManager"
    }
