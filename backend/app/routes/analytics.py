from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, and_, desc
from ..database import get_db
from ..models import Transaction, Alert

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Transaction).count()
    anomalies = db.query(Transaction).filter(Transaction.is_anomaly == True).count()
    avg_risk = db.query(func.avg(Transaction.risk_score)).scalar() or 0
    return {
        "total": total,
        "anomalies": anomalies,
        "anomaly_rate": round((anomalies / total * 100) if total > 0 else 0, 2),
        "avg_risk_score": round(float(avg_risk), 3)
    }

@router.get("/daily")
def get_daily(db: Session = Depends(get_db)):
    rows = db.query(
        cast(Transaction.timestamp, Date).label("day"),
        func.count(Transaction.id).label("total"),
        func.count(Transaction.id).filter(Transaction.is_anomaly == True).label("anomalies")
    ).group_by(cast(Transaction.timestamp, Date)).order_by(cast(Transaction.timestamp, Date)).all()

    return [
        {"day": str(r.day), "total": int(r.total), "anomalies": int(r.anomalies)}
        for r in rows
    ]

@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    low = db.query(Transaction).filter(Transaction.risk_score < 0.3).count()
    medium = db.query(Transaction).filter(Transaction.risk_score >= 0.3, Transaction.risk_score < 0.6).count()
    high = db.query(Transaction).filter(Transaction.risk_score >= 0.6, Transaction.risk_score < 0.8).count()
    critical = db.query(Transaction).filter(Transaction.risk_score >= 0.8).count()

    segments = {
        "Faible": low,
        "Modere": medium,
        "Eleve": high,
        "Critique": critical,
    }
    return [{"segment": k, "count": v} for k, v in segments.items()]


# ANALYSE 1: DÉTECTION D'ANOMALIES ET FRAUDE
@router.get("/fraud-detection")
def fraud_detection_analysis(db: Session = Depends(get_db)):
    """
    Analyse 1: Détection d'anomalies et fraude
    - Distribution des transactions suspectes
    - Taux d'anomalies par catégorie
    - Montants moyens des fraudes
    """
    total_transactions = db.query(func.count(Transaction.id)).scalar()
    anomalous_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.is_anomaly == True
    ).scalar()
    
    # Anomalies par catégorie
    anomalies_by_category = db.query(
        Transaction.category,
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.amount).label("avg_amount"),
        func.max(Transaction.amount).label("max_amount")
    ).filter(Transaction.is_anomaly == True).group_by(Transaction.category).all()
    
    # Anomalies par pays
    anomalies_by_country = db.query(
        Transaction.country,
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.risk_score).label("avg_risk_score")
    ).filter(Transaction.is_anomaly == True).group_by(Transaction.country).all()
    
    # Tendance temporelle des anomalies
    time_series = db.query(
        cast(Transaction.timestamp, Date).label("date"),
        func.count(Transaction.id).label("total"),
        func.count(Transaction.id).filter(Transaction.is_anomaly == True).label("anomalies")
    ).group_by(cast(Transaction.timestamp, Date)).order_by(
        cast(Transaction.timestamp, Date)
    ).all()
    
    return {
        "summary": {
            "total_transactions": total_transactions,
            "anomalous_transactions": anomalous_transactions,
            "anomaly_rate": round((anomalous_transactions / max(total_transactions, 1)) * 100, 2)
        },
        "anomalies_by_category": [
            {
                "category": cat,
                "count": count,
                "avg_amount": round(avg_amount, 2) if avg_amount else 0,
                "max_amount": round(max_amount, 2) if max_amount else 0
            }
            for cat, count, avg_amount, max_amount in anomalies_by_category
        ],
        "anomalies_by_country": [
            {
                "country": country,
                "count": count,
                "avg_risk_score": round(avg_risk, 2) if avg_risk else 0
            }
            for country, count, avg_risk in anomalies_by_country
        ],
        "time_series": [
            {
                "date": str(date),
                "total": total,
                "anomalies": int(anomalies) if anomalies else 0
            }
            for date, total, anomalies in time_series
        ]
    }


# ANALYSE 2: COMPORTEMENT DES UTILISATEURS
@router.get("/user-behavior")
def user_behavior_analysis(db: Session = Depends(get_db)):
    """
    Analyse 2: Comportement des utilisateurs
    - Segmentation par montant moyen
    - Fréquence de transactions
    - Catégories préférées
    """
    
    # Statistiques par utilisateur
    user_stats = db.query(
        Transaction.user_id,
        func.count(Transaction.id).label("transaction_count"),
        func.avg(Transaction.amount).label("avg_amount"),
        func.max(Transaction.amount).label("max_amount"),
        func.min(Transaction.amount).label("min_amount"),
        func.sum(Transaction.amount).label("total_spent")
    ).group_by(Transaction.user_id).all()
    
    # Segmentation: utilisateurs à haut/moyen/bas risque
    users_high_risk = db.query(Transaction.user_id).filter(
        Transaction.risk_score > 0.7
    ).distinct().count()
    
    users_medium_risk = db.query(Transaction.user_id).filter(
        and_(Transaction.risk_score > 0.3, Transaction.risk_score <= 0.7)
    ).distinct().count()
    
    users_low_risk = db.query(Transaction.user_id).filter(
        Transaction.risk_score <= 0.3
    ).distinct().count()
    
    return {
        "user_statistics": [
            {
                "user_id": uid,
                "transaction_count": count,
                "avg_amount": round(avg_amt, 2) if avg_amt else 0,
                "max_amount": round(max_amt, 2) if max_amt else 0,
                "min_amount": round(min_amt, 2) if min_amt else 0,
                "total_spent": round(total, 2) if total else 0
            }
            for uid, count, avg_amt, max_amt, min_amt, total in user_stats[:20]
        ],
        "risk_segmentation": {
            "high_risk_users": users_high_risk,
            "medium_risk_users": users_medium_risk,
            "low_risk_users": users_low_risk
        }
    }


# ANALYSE 3: MODÈLE DE SCORING DE RISQUE PRÉDICTIF
@router.get("/risk-scoring")
def risk_scoring_analysis(db: Session = Depends(get_db)):
    """
    Analyse 3: Modèle de scoring de risque prédictif
    - Distribution des scores de risque
    - Facteurs de risque (montant, pays, catégorie)
    - Corrélation risque/anomalies
    """
    
    # Facteurs de risque par catégorie
    category_risk = db.query(
        Transaction.category,
        func.count(Transaction.id).label("total"),
        func.avg(Transaction.risk_score).label("avg_risk"),
        func.count(Transaction.id).filter(Transaction.is_anomaly == True).label("anomalies")
    ).group_by(Transaction.category).all()
    
    # Facteurs de risque par pays
    country_risk = db.query(
        Transaction.country,
        func.count(Transaction.id).label("total"),
        func.avg(Transaction.risk_score).label("avg_risk"),
        func.count(Transaction.id).filter(Transaction.is_anomaly == True).label("anomalies")
    ).group_by(Transaction.country).all()
    
    return {
        "category_risk_factors": [
            {
                "category": cat,
                "transaction_count": total,
                "avg_risk_score": round(avg_risk, 3) if avg_risk else 0,
                "anomaly_count": int(anomalies) if anomalies else 0,
                "anomaly_rate": round((anomalies / max(total, 1)) * 100, 2) if anomalies else 0
            }
            for cat, total, avg_risk, anomalies in category_risk
        ],
        "country_risk_factors": [
            {
                "country": country,
                "transaction_count": total,
                "avg_risk_score": round(avg_risk, 3) if avg_risk else 0,
                "anomaly_count": int(anomalies) if anomalies else 0,
                "anomaly_rate": round((anomalies / max(total, 1)) * 100, 2) if anomalies else 0
            }
            for country, total, avg_risk, anomalies in country_risk
        ]
    }


# ANALYSE SUPPLÉMENTAIRE: ALERTES
@router.get("/alerts-analysis")
def alerts_analysis(db: Session = Depends(get_db)):
    """
    Analyse supplémentaire: Analyse des alertes
    - Distribution par type et sévérité
    - Taux de résolution
    """
    
    # Alertes par type et sévérité
    alerts_summary = db.query(
        Alert.alert_type,
        Alert.severity,
        func.count(Alert.id).label("count"),
        func.count(Alert.id).filter(Alert.resolved == True).label("resolved_count")
    ).group_by(Alert.alert_type, Alert.severity).all()
    
    # Alertes non résolues
    unresolved_alerts = db.query(Alert).filter(Alert.resolved == False).count()
    total_alerts = db.query(Alert).count()
    
    return {
        "alerts_by_type_severity": [
            {
                "alert_type": alert_type,
                "severity": severity,
                "total": count,
                "resolved": resolved_count,
                "resolution_rate": round((resolved_count / max(count, 1)) * 100, 2)
            }
            for alert_type, severity, count, resolved_count in alerts_summary
        ],
        "resolution_status": {
            "unresolved": unresolved_alerts,
            "resolved": total_alerts - unresolved_alerts,
            "total": total_alerts,
            "resolution_rate": round(((total_alerts - unresolved_alerts) / max(total_alerts, 1)) * 100, 2)
        }
    }


# EXPORT RAW DATA
@router.get("/transactions-export")
def transactions_export(limit: int = 1000, db: Session = Depends(get_db)):
    """
    Export des transactions brutes pour analyse externe
    """
    transactions = db.query(Transaction).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "amount": t.amount,
            "currency": t.currency,
            "merchant": t.merchant,
            "category": t.category,
            "country": t.country,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "is_anomaly": t.is_anomaly,
            "risk_score": t.risk_score,
            "status": t.status
        }
        for t in transactions
    ]