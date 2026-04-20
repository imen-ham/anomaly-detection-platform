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