from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from ..database import get_db
from ..models import Transaction

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
    ).group_by(
        cast(Transaction.timestamp, Date)
    ).order_by(
        cast(Transaction.timestamp, Date)
    ).all()
    return [{"day": str(r.day), "total": r.total, "anomalies": r.anomalies} for r in rows]

@router.get("/risk-distribution")
def get_risk_distribution(db: Session = Depends(get_db)):
    txs = db.query(Transaction.risk_score).all()
    segments = {"Faible risque": 0, "Risque modere": 0, "Risque eleve": 0, "Critique": 0}
    for (score,) in txs:
        if score < 0.3:
            segments["Faible risque"] += 1
        elif score < 0.6:
            segments["Risque modere"] += 1
        elif score < 0.8:
            segments["Risque eleve"] += 1
        else:
            segments["Critique"] += 1
    return [{"segment": k, "count": v} for k, v in segments.items()]